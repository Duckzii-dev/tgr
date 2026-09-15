import { prisma } from '../utils/prisma.js';
import { volume, isoWeek } from '../utils/calc.js';

function rangeFrom(query) {
  const { from, to } = query;
  return {
    from: from ? new Date(from) : new Date(0),
    to: to ? new Date(to) : new Date(),
  };
}

export async function analyticsOverview(req, res) {
  const userId = req.user.id;
  const { from, to } = rangeFrom(req.query);

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

  for (const w of workouts) {
    totalDuration += w.duration || 0;

    const wk = isoWeek(w.date);
    weekly[wk] = (weekly[wk] || 0) + (w.duration || 0);

    const mk = new Date(w.date).toISOString().slice(0, 7);
    monthly[mk] = (monthly[mk] || 0) + (w.duration || 0);

    for (const we of w.exercises) {
      exerciseFreq[we.exercise.name] = (exerciseFreq[we.exercise.name] || 0) + 1;
      for (const s of we.sets) {
        totalSets++;
        totalReps += s.reps;
        const v = volume(s.weight, s.reps);
        totalVolume += v;
        muscleVolume[we.exercise.muscleGroup] =
          (muscleVolume[we.exercise.muscleGroup] || 0) + v;
      }
    }
  }

  const durations = workouts.map((w) => w.duration || 0).filter((d) => d > 0);

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
  });
}

export async function streak(req, res) {
  const userId = req.user.id;
  const workouts = await prisma.workout.findMany({
    where: { userId },
    select: { date: true },
    orderBy: { date: 'asc' },
  });
  const dates = new Set(workouts.map((w) => new Date(w.date).toISOString().slice(0, 10)));

  let current = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    if (dates.has(k)) current++;
    else if (i > 0) break;
  }

  let longest = 0;
  let streak = 0;
  let prev = null;
  const sorted = [...dates].sort();
  for (const k of sorted) {
    if (prev) {
      const diff = (new Date(k) - new Date(prev)) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    } else streak = 1;
    prev = k;
    if (streak > longest) longest = streak;
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