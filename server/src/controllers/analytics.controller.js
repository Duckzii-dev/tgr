import { prisma } from '../utils/prisma.js';
import {
  volume,
  dateKeyInTz,
  yearMonthInTz,
  isoWeekInTz,
} from '../utils/calc.js';

function rangeFrom(query) {
  const { from, to } = query;
  return {
    from: from ? new Date(from) : new Date(0),
    to: to ? new Date(to) : new Date(),
  };
}

async function getUserTz(userId) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true },
  });
  return u?.timezone || 'UTC';
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function analyticsOverview(req, res) {
  const userId = req.user.id;
  const { from, to } = rangeFrom(req.query);
  const tz = await getUserTz(userId);

  const workouts = await prisma.workout.findMany({
    where: { userId, date: { gte: from, lte: to } },
    include: { exercises: { include: { exercise: true, sets: true } } },
    orderBy: { date: 'asc' },
  });

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let totalDuration = 0;
  const muscleVolume = {};
  const exerciseFreq = {};
  const weekly = {};
  const monthly = {};

  // Training Load aggregations
  const byDayOfWeek = {}; // { 'Mon': { sets, reps, volume, rirSum, rirCount, workoutCount }, ... }
  const byWeek = {}; // { '2026-W37': { sets, reps, volume, rirSum, rirCount, workoutCount }, ... }

  for (let i = 0; i < 7; i++) {
    byDayOfWeek[DOW_LABELS[i]] = {
      dow: DOW_LABELS[i],
      sets: 0,
      reps: 0,
      volume: 0,
      rirSum: 0,
      rirCount: 0,
      workoutCount: 0,
    };
  }

  for (const w of workouts) {
    totalDuration += w.duration || 0;

    const wk = isoWeekInTz(w.date, tz);
    weekly[wk] = (weekly[wk] || 0) + (w.duration || 0);

    const { year, month } = yearMonthInTz(w.date, tz);
    const mk = `${year}-${String(month).padStart(2, '0')}`;
    monthly[mk] = (monthly[mk] || 0) + (w.duration || 0);

    // Training load: by day of week
    const dateKey = dateKeyInTz(w.date, tz);
    const dowIdx = new Date(dateKey + 'T12:00:00Z').getUTCDay();
    const dowLabel = DOW_LABELS[dowIdx];
    const dowBucket = byDayOfWeek[dowLabel];
    dowBucket.workoutCount += 1;

    // Training load: by week
    if (!byWeek[wk]) {
      byWeek[wk] = {
        week: wk,
        sets: 0,
        reps: 0,
        volume: 0,
        rirSum: 0,
        rirCount: 0,
        workoutCount: 0,
      };
    }
    const weekBucket = byWeek[wk];
    weekBucket.workoutCount += 1;

    for (const we of w.exercises) {
      exerciseFreq[we.exercise.name] = (exerciseFreq[we.exercise.name] || 0) + 1;
      for (const s of we.sets) {
        totalSets++;
        totalReps += s.reps;
        const v = volume(s.weight, s.reps);
        totalVolume += v;
        muscleVolume[we.exercise.muscleGroup] =
          (muscleVolume[we.exercise.muscleGroup] || 0) + v;

        dowBucket.sets += 1;
        dowBucket.reps += s.reps;
        dowBucket.volume += v;
        if (s.rir != null) {
          dowBucket.rirSum += s.rir;
          dowBucket.rirCount += 1;
        }

        weekBucket.sets += 1;
        weekBucket.reps += s.reps;
        weekBucket.volume += v;
        if (s.rir != null) {
          weekBucket.rirSum += s.rir;
          weekBucket.rirCount += 1;
        }
      }
    }
  }

  const durations = workouts.map((w) => w.duration || 0).filter((d) => d > 0);

  // Convert aggregations to arrays
  const trainingLoadByDow = DOW_LABELS.map((label) => {
    const b = byDayOfWeek[label];
    return {
      dow: label,
      sets: b.sets,
      reps: b.reps,
      volume: b.volume,
      avgRir: b.rirCount ? +(b.rirSum / b.rirCount).toFixed(2) : null,
      workoutCount: b.workoutCount,
    };
  });

  const trainingLoadByWeek = Object.values(byWeek)
    .map((b) => ({
      week: b.week,
      sets: b.sets,
      reps: b.reps,
      volume: b.volume,
      avgRir: b.rirCount ? +(b.rirSum / b.rirCount).toFixed(2) : null,
      workoutCount: b.workoutCount,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  res.json({
    totalWorkouts: workouts.length,
    totalSets,
    totalReps,
    totalVolume,
    totalDuration,
    avgSession: workouts.length ? Math.round(totalDuration / workouts.length) : 0,
    minSession: durations.length ? Math.min(...durations) : 0,
    maxSession: durations.length ? Math.max(...durations) : 0,
    muscleVolume: Object.entries(muscleVolume).map(([muscleGroup, v]) => ({
      muscleGroup,
      volume: v,
    })),
    exerciseFrequency: Object.entries(exerciseFreq)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    weeklyDuration: Object.entries(weekly).map(([week, seconds]) => ({ week, seconds })),
    monthlyDuration: Object.entries(monthly).map(([month, seconds]) => ({ month, seconds })),
    trainingLoadByDow,
    trainingLoadByWeek,
  });
}

export async function streak(req, res) {
  const userId = req.user.id;
  const tz = await getUserTz(userId);
  const workouts = await prisma.workout.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'asc' },
  });
  const dates = new Set(workouts.map((w) => dateKeyInTz(w.date, tz)));

  let current = 0;
  const todayKey = dateKeyInTz(new Date(), tz);
  const today = new Date(todayKey + 'T00:00:00Z');
  for (let i = 0; i < 3650; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const k = d.toISOString().slice(0, 10);
    if (dates.has(k)) {
      current++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  let longest = 0;
  let run = 0;
  let prev = null;
  const sorted = [...dates].sort();
  for (const k of sorted) {
    if (prev) {
      const diff = (new Date(k) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    prev = k;
    if (run > longest) longest = run;
  }

  res.json({ current, longest });
}

export async function exerciseProgression(req, res) {
  const userId = req.user.id;
  const { exerciseId } = req.params;
  const { from, to } = rangeFrom(req.query);

  const sets = await prisma.workoutSet.findMany({
    where: {
      workoutExercise: {
        exerciseId,
        workout: { userId, date: { gte: from, lte: to } },
      },
    },
    include: { workoutExercise: { include: { workout: true } } },
    orderBy: { workoutExercise: { workout: { date: 'asc' } } },
  });

  const byDay = new Map();
  for (const s of sets) {
    const k = new Date(s.workoutExercise.workout.date).toISOString().slice(0, 10);
    if (!byDay.has(k)) {
      byDay.set(k, { date: k, maxWeight: 0, totalVolume: 0, totalReps: 0, estimated1RM: 0 });
    }
    const d = byDay.get(k);
    if (s.weight > d.maxWeight) d.maxWeight = s.weight;
    d.totalVolume += volume(s.weight, s.reps);
    d.totalReps += s.reps;
    if (s.estimated1RM && s.estimated1RM > d.estimated1RM) d.estimated1RM = s.estimated1RM;
  }

  res.json({ progression: [...byDay.values()] });
}