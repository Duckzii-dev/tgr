#!/usr/bin/env bash
# ================================================================
# FEATURE 8: MUSCLE MAP CHI TIẾT + EXERCISE CONTRIBUTION
# 1 bash — tất cả file, không chia nhỏ
# Chạy từ root repo: bash feature8-muscle-detail.sh
# ================================================================
set -euo pipefail

ROOT="$(pwd)"
echo "📁 Root: $ROOT"

# ============================================================
# 1. server/public/exercise-muscles.json
# ============================================================
mkdir -p server/public
cat > server/public/exercise-muscles.json <<'EOF'
{
  "Bench Press": { "chest": 1.0, "upper_chest": 0.4, "front_delt": 0.6, "triceps": 0.5 },
  "Incline Bench Press": { "upper_chest": 1.0, "chest": 0.6, "front_delt": 0.7, "triceps": 0.5 },
  "Decline Bench Press": { "chest": 1.0, "triceps": 0.5, "front_delt": 0.3 },
  "Dumbbell Bench Press": { "chest": 1.0, "upper_chest": 0.4, "front_delt": 0.5, "triceps": 0.5 },
  "Incline Dumbbell Press": { "upper_chest": 1.0, "chest": 0.6, "front_delt": 0.6, "triceps": 0.4 },
  "Cable Fly": { "chest": 1.0, "upper_chest": 0.3, "front_delt": 0.3 },
  "Pec Deck": { "chest": 1.0, "front_delt": 0.2 },
  "Push-up": { "chest": 1.0, "triceps": 0.6, "front_delt": 0.5, "abs": 0.3 },
  "Dips": { "chest": 0.8, "triceps": 0.9, "front_delt": 0.5 },
  "Deadlift": { "lower_back": 1.0, "glutes": 0.9, "hamstrings": 0.8, "traps": 0.6, "lats": 0.4, "forearms": 0.6 },
  "Barbell Row": { "middle_back": 1.0, "lats": 0.9, "biceps": 0.5, "rear_delt": 0.5, "lower_back": 0.4 },
  "T-Bar Row": { "middle_back": 1.0, "lats": 0.8, "rear_delt": 0.4, "biceps": 0.5 },
  "Lat Pulldown": { "lats": 1.0, "middle_back": 0.6, "biceps": 0.5, "rear_delt": 0.3 },
  "Pull-up": { "lats": 1.0, "middle_back": 0.6, "biceps": 0.6, "forearms": 0.4, "abs": 0.3 },
  "Chin-up": { "lats": 0.8, "biceps": 1.0, "middle_back": 0.5, "forearms": 0.4 },
  "Seated Cable Row": { "middle_back": 1.0, "lats": 0.7, "rear_delt": 0.4, "biceps": 0.4 },
  "Dumbbell Row": { "lats": 1.0, "middle_back": 0.7, "biceps": 0.4, "rear_delt": 0.4 },
  "Face Pull": { "rear_delt": 1.0, "traps": 0.6, "middle_back": 0.5 },
  "Shrug": { "traps": 1.0, "neck": 0.3, "forearms": 0.3 },
  "Overhead Press": { "front_delt": 1.0, "side_delt": 0.7, "triceps": 0.6, "abs": 0.3, "traps": 0.4 },
  "Dumbbell Shoulder Press": { "front_delt": 1.0, "side_delt": 0.6, "triceps": 0.5, "traps": 0.3 },
  "Arnold Press": { "front_delt": 1.0, "side_delt": 0.9, "rear_delt": 0.3, "triceps": 0.5 },
  "Lateral Raise": { "side_delt": 1.0, "front_delt": 0.3, "traps": 0.3 },
  "Front Raise": { "front_delt": 1.0, "upper_chest": 0.3 },
  "Rear Delt Fly": { "rear_delt": 1.0, "middle_back": 0.4, "traps": 0.3 },
  "Cable Lateral Raise": { "side_delt": 1.0, "front_delt": 0.2 },
  "Upright Row": { "side_delt": 0.9, "traps": 0.8, "biceps": 0.3, "rear_delt": 0.4 },
  "Barbell Curl": { "biceps": 1.0, "forearms": 0.4 },
  "Dumbbell Curl": { "biceps": 1.0, "forearms": 0.3 },
  "Hammer Curl": { "biceps": 0.8, "forearms": 0.7 },
  "Preacher Curl": { "biceps": 1.0, "forearms": 0.3 },
  "Concentration Curl": { "biceps": 1.0 },
  "Cable Curl": { "biceps": 1.0, "forearms": 0.4 },
  "Incline Dumbbell Curl": { "biceps": 1.0, "forearms": 0.3 },
  "Chin-up (biceps)": { "biceps": 1.0, "lats": 0.5, "forearms": 0.4 },
  "Triceps Pushdown": { "triceps": 1.0, "forearms": 0.2 },
  "Overhead Triceps Extension": { "triceps": 1.0 },
  "Skull Crusher": { "triceps": 1.0 },
  "Close-Grip Bench Press": { "triceps": 1.0, "chest": 0.5, "front_delt": 0.4 },
  "Diamond Push-up": { "triceps": 1.0, "chest": 0.6, "front_delt": 0.4, "abs": 0.3 },
  "Triceps Kickback": { "triceps": 1.0 },
  "Bench Dip": { "triceps": 1.0, "chest": 0.4, "front_delt": 0.4 },
  "Squat": { "quads": 1.0, "glutes": 0.8, "hamstrings": 0.5, "lower_back": 0.5, "abs": 0.6 },
  "Front Squat": { "quads": 1.0, "glutes": 0.6, "abs": 0.8, "middle_back": 0.4 },
  "Romanian Deadlift": { "hamstrings": 1.0, "glutes": 0.9, "lower_back": 0.7 },
  "Leg Press": { "quads": 1.0, "glutes": 0.6, "hamstrings": 0.4 },
  "Leg Extension": { "quads": 1.0 },
  "Leg Curl": { "hamstrings": 1.0 },
  "Walking Lunge": { "quads": 1.0, "glutes": 0.9, "hamstrings": 0.5, "calves": 0.3 },
  "Bulgarian Split Squat": { "quads": 1.0, "glutes": 0.9, "hamstrings": 0.5, "abs": 0.4 },
  "Calf Raise": { "calves": 1.0 },
  "Hip Thrust": { "glutes": 1.0, "hamstrings": 0.6, "quads": 0.3 },
  "Hack Squat": { "quads": 1.0, "glutes": 0.6 },
  "Goblet Squat": { "quads": 1.0, "glutes": 0.7, "abs": 0.5 }
}
EOF
echo "✅ server/public/exercise-muscles.json"

# ============================================================
# 2. server/src/services/muscle.service.js
# ============================================================
mkdir -p server/src/services
cat > server/src/services/muscle.service.js <<'EOF'
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSCLE_MAP_FILE = path.join(
  __dirname,
  '..',
  '..',
  'public',
  'exercise-muscles.json'
);

let _cache = null;

export async function loadMuscleMap() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(MUSCLE_MAP_FILE, 'utf8');
    _cache = JSON.parse(raw);
  } catch {
    _cache = {};
  }
  return _cache;
}

export async function getMuscleContributions(exercise) {
  const map = await loadMuscleMap();
  if (map[exercise.name]) return map[exercise.name];
  const g = exercise.muscleGroup || 'other';
  return { [g]: 1.0 };
}

export const MUSCLE_GROUPS_DETAILED = [
  'neck',
  'traps',
  'front_delt',
  'side_delt',
  'rear_delt',
  'upper_chest',
  'chest',
  'lats',
  'middle_back',
  'lower_back',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'cardio',
];

export const MUSCLE_GROUP_LABELS = {
  neck: 'Neck',
  traps: 'Traps',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest',
  chest: 'Chest',
  lats: 'Lats',
  middle_back: 'Middle Back',
  lower_back: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
};

export function labelFor(mg) {
  return MUSCLE_GROUP_LABELS[mg] || mg;
}

export const RECOVERY_HOURS = {
  neck: 24,
  traps: 48,
  front_delt: 48,
  side_delt: 48,
  rear_delt: 48,
  upper_chest: 72,
  chest: 72,
  lats: 72,
  middle_back: 72,
  lower_back: 72,
  biceps: 48,
  triceps: 48,
  forearms: 24,
  abs: 24,
  obliques: 24,
  glutes: 72,
  quads: 72,
  hamstrings: 72,
  calves: 48,
  cardio: 24,
};
EOF
echo "✅ server/src/services/muscle.service.js"

# ============================================================
# 3. server/src/controllers/analytics.controller.js
# ============================================================
mkdir -p server/src/controllers
cat > server/src/controllers/analytics.controller.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { volume, dateKeyInTz, yearMonthInTz, isoWeekInTz } from '../utils/calc.js';
import {
  getMuscleContributions,
  MUSCLE_GROUPS_DETAILED,
  RECOVERY_HOURS,
} from '../services/muscle.service.js';

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

  let totalSets = 0, totalReps = 0, totalVolume = 0, totalDuration = 0;
  const muscleVolume = {};
  const exerciseFreq = {};
  const weekly = {};
  const monthly = {};

  const byDayOfWeek = {};
  const byWeek = {};
  for (let i = 0; i < 7; i++) {
    byDayOfWeek[DOW_LABELS[i]] = {
      dow: DOW_LABELS[i], sets: 0, reps: 0, volume: 0,
      rirSum: 0, rirCount: 0, workoutCount: 0,
    };
  }

  const now = new Date();
  const recovery = {};
  for (const mg of MUSCLE_GROUPS_DETAILED) {
    recovery[mg] = {
      muscleGroup: mg,
      lastTrainedAt: null,
      sets7d: 0, sets30d: 0, volume7d: 0, volume30d: 0,
      recoveryHours: RECOVERY_HOURS[mg] || 48,
    };
  }

  const cutoff7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

  for (const w of workouts) {
    totalDuration += w.duration || 0;

    const wk = isoWeekInTz(w.date, tz);
    weekly[wk] = (weekly[wk] || 0) + (w.duration || 0);

    const { year, month } = yearMonthInTz(w.date, tz);
    const mk = `${year}-${String(month).padStart(2, '0')}`;
    monthly[mk] = (monthly[mk] || 0) + (w.duration || 0);

    const dateKey = dateKeyInTz(w.date, tz);
    const dowIdx = new Date(dateKey + 'T12:00:00Z').getUTCDay();
    const dowBucket = byDayOfWeek[DOW_LABELS[dowIdx]];
    dowBucket.workoutCount += 1;

    if (!byWeek[wk]) {
      byWeek[wk] = {
        week: wk, sets: 0, reps: 0, volume: 0,
        rirSum: 0, rirCount: 0, workoutCount: 0,
      };
    }
    const weekBucket = byWeek[wk];
    weekBucket.workoutCount += 1;

    const workoutDate = new Date(w.date);
    const isWithin7d = workoutDate >= cutoff7;
    const isWithin30d = workoutDate >= cutoff30;

    for (const we of w.exercises) {
      exerciseFreq[we.exercise.name] = (exerciseFreq[we.exercise.name] || 0) + 1;
      const contrib = await getMuscleContributions(we.exercise);

      for (const s of we.sets) {
        if (s.isWarmup) continue;

        totalSets++;
        totalReps += s.reps;
        const v = volume(s.weight, s.reps);
        totalVolume += v;

        dowBucket.sets += 1;
        dowBucket.reps += s.reps;
        dowBucket.volume += v;
        if (s.rir != null) { dowBucket.rirSum += s.rir; dowBucket.rirCount += 1; }

        weekBucket.sets += 1;
        weekBucket.reps += s.reps;
        weekBucket.volume += v;
        if (s.rir != null) { weekBucket.rirSum += s.rir; weekBucket.rirCount += 1; }

        for (const [mg, weight] of Object.entries(contrib)) {
          if (!(mg in recovery)) continue;
          const rec = recovery[mg];
          if (!rec.lastTrainedAt || workoutDate > new Date(rec.lastTrainedAt)) {
            rec.lastTrainedAt = workoutDate.toISOString();
          }
          if (isWithin7d) {
            rec.sets7d += weight;
            rec.volume7d += v * weight;
          }
          if (isWithin30d) {
            rec.sets30d += weight;
            rec.volume30d += v * weight;
          }
          muscleVolume[mg] = (muscleVolume[mg] || 0) + v * weight;
        }
      }
    }
  }

  const durations = workouts.map((w) => w.duration || 0).filter((d) => d > 0);

  const trainingLoadByDow = DOW_LABELS.map((label) => {
    const b = byDayOfWeek[label];
    return {
      dow: label, sets: b.sets, reps: b.reps, volume: b.volume,
      avgRir: b.rirCount ? +(b.rirSum / b.rirCount).toFixed(2) : null,
      workoutCount: b.workoutCount,
    };
  });

  const trainingLoadByWeek = Object.values(byWeek)
    .map((b) => ({
      week: b.week, sets: b.sets, reps: b.reps, volume: b.volume,
      avgRir: b.rirCount ? +(b.rirSum / b.rirCount).toFixed(2) : null,
      workoutCount: b.workoutCount,
    }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const recoveryList = Object.values(recovery).map((r) => {
    let percent = 100, hoursSince = null, hoursRemaining = null;
    if (r.lastTrainedAt) {
      hoursSince = (now - new Date(r.lastTrainedAt)) / 3600000;
      const ratio = Math.min(1, hoursSince / r.recoveryHours);
      percent = Math.round(ratio * 100);
      hoursRemaining = Math.max(0, Math.round(r.recoveryHours - hoursSince));
    }
    return {
      muscleGroup: r.muscleGroup,
      lastTrainedAt: r.lastTrainedAt,
      sets7d: +r.sets7d.toFixed(1),
      sets30d: +r.sets30d.toFixed(1),
      volume7d: Math.round(r.volume7d),
      volume30d: Math.round(r.volume30d),
      recoveryHours: r.recoveryHours,
      hoursSince: hoursSince != null ? +hoursSince.toFixed(1) : null,
      hoursRemaining,
      percent,
    };
  });

  res.json({
    totalWorkouts: workouts.length,
    totalSets, totalReps, totalVolume, totalDuration,
    avgSession: workouts.length ? Math.round(totalDuration / workouts.length) : 0,
    minSession: durations.length ? Math.min(...durations) : 0,
    maxSession: durations.length ? Math.max(...durations) : 0,
    muscleVolume: Object.entries(muscleVolume).map(([muscleGroup, v]) => ({ muscleGroup, volume: v })),
    exerciseFrequency: Object.entries(exerciseFreq)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    weeklyDuration: Object.entries(weekly).map(([week, seconds]) => ({ week, seconds })),
    monthlyDuration: Object.entries(monthly).map(([month, seconds]) => ({ month, seconds })),
    trainingLoadByDow,
    trainingLoadByWeek,
    recovery: recoveryList,
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
    if (dates.has(k)) current++;
    else if (i === 0) continue;
    else break;
  }

  let longest = 0, run = 0, prev = null;
  for (const k of [...dates].sort()) {
    if (prev) {
      const diff = (new Date(k) - new Date(prev)) / 86400000;
      run = diff === 1 ? run + 1 : 1;
    } else run = 1;
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
      isWarmup: false,
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
EOF
echo "✅ server/src/controllers/analytics.controller.js"

# ============================================================
# 4. server/src/controllers/exercise.controller.js
# ============================================================
cat > server/src/controllers/exercise.controller.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM } from '../utils/calc.js';
import {
  getMuscleContributions,
  labelFor,
} from '../services/muscle.service.js';

function computeBestForExercise(sessions) {
  const best = {
    max_weight: null, max_reps: null,
    estimated_1rm: null, max_volume: null,
  };
  for (const sess of sessions) {
    for (const s of sess.sets) {
      const at = sess.date;
      if (!best.max_weight || s.weight > best.max_weight.value)
        best.max_weight = { type: 'max_weight', value: s.weight, reps: s.reps, weight: s.weight, achievedAt: at };
      if (!best.max_reps || s.reps > best.max_reps.value)
        best.max_reps = { type: 'max_reps', value: s.reps, reps: s.reps, weight: s.weight, achievedAt: at };
      const v = s.weight * s.reps;
      if (!best.max_volume || v > best.max_volume.value)
        best.max_volume = { type: 'max_volume', value: v, reps: s.reps, weight: s.weight, achievedAt: at };
      const est = s.estimated1RM ?? epley1RM(s.weight, s.reps);
      if (est != null && s.reps > 0 && s.reps <= 20) {
        if (!best.estimated_1rm || est > best.estimated_1rm.value)
          best.estimated_1rm = { type: 'estimated_1rm', value: est, reps: s.reps, weight: s.weight, achievedAt: at };
      }
    }
  }
  return Object.values(best).filter(Boolean).sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));
}

export async function listExercises(req, res) {
  const userId = req.user.id;
  const { q, muscleGroup, limit, offset } = req.query;
  const where = {
    AND: [
      { OR: [{ userId: null }, { userId }] },
      q ? { name: { contains: q } } : {},
      muscleGroup ? { muscleGroup } : {},
    ],
  };
  const take = limit ? Math.min(200, Number(limit)) : 100;
  const skip = offset ? Number(offset) : 0;

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
      take, skip,
      select: {
        id: true, name: true, muscleGroup: true, equipment: true,
        isCustom: true, videoUrl: true, imageUrl: true,
      },
    }),
    prisma.exercise.count({ where }),
  ]);

  res.json({ exercises, total });
}

export async function createExercise(req, res) {
  const { name, muscleGroup, equipment } = req.body;
  if (!name || !muscleGroup) throw httpError(400, 'name and muscleGroup required');
  try {
    const exercise = await prisma.exercise.create({
      data: { name, muscleGroup, equipment, isCustom: true, userId: req.user.id },
    });
    res.status(201).json({ exercise });
  } catch {
    throw httpError(409, 'Exercise already exists');
  }
}

export async function getExercise(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const exercise = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
  });
  if (!exercise) throw httpError(404, 'Exercise not found');

  const sets = await prisma.workoutSet.findMany({
    where: {
      isWarmup: false,
      workoutExercise: { exerciseId: id, workout: { userId } },
    },
    include: { workoutExercise: { include: { workout: true } } },
    orderBy: { workoutExercise: { workout: { date: 'asc' } } },
  });

  const sessions = new Map();
  for (const s of sets) {
    const w = s.workoutExercise.workout;
    if (!sessions.has(w.id)) {
      sessions.set(w.id, { workoutId: w.id, date: w.date, name: w.name, sets: [] });
    }
    sessions.get(w.id).sets.push({
      id: s.id, setNumber: s.setNumber,
      weight: s.weight, reps: s.reps,
      rir: s.rir, rpe: s.rpe, estimated1RM: s.estimated1RM,
    });
  }
  const sessionList = [...sessions.values()].sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalSets = 0, totalReps = 0, totalVolume = 0;
  let maxWeight = 0, best1RM = 0, best5 = 0, best10 = 0;
  let startingWeight = null, currentBest = 0;
  let rirSum = 0, rirCount = 0, rpeSum = 0, rpeCount = 0;
  const rirDistribution = {};
  const rpeProgression = [];

  for (const sess of sessionList) {
    let sRirSum = 0, sRirCount = 0, sRpeSum = 0, sRpeCount = 0;
    for (const s of sess.sets) {
      totalSets++;
      totalReps += s.reps;
      totalVolume += volume(s.weight, s.reps);
      if (startingWeight == null) startingWeight = s.weight;
      if (s.weight > maxWeight) maxWeight = s.weight;
      if (s.estimated1RM && s.estimated1RM > best1RM) best1RM = s.estimated1RM;
      if (s.reps >= 5 && s.weight > best5) best5 = s.weight;
      if (s.reps >= 10 && s.weight > best10) best10 = s.weight;
      if (s.rir != null) {
        rirSum += s.rir; rirCount++; sRirSum += s.rir; sRirCount++;
        const key = String(s.rir);
        rirDistribution[key] = (rirDistribution[key] || 0) + 1;
      }
      if (s.rpe != null) { rpeSum += s.rpe; rpeCount++; sRpeSum += s.rpe; sRpeCount++; }
    }
    if (sess.sets.length) currentBest = Math.max(currentBest, ...sess.sets.map((s) => s.weight));
    if (sRirCount > 0 || sRpeCount > 0) {
      rpeProgression.push({
        date: new Date(sess.date).toISOString().slice(0, 10),
        avgRir: sRirCount ? +(sRirSum / sRirCount).toFixed(2) : null,
        avgRpe: sRpeCount ? +(sRpeSum / sRpeCount).toFixed(2) : null,
      });
    }
  }

  const prs = computeBestForExercise(sessionList);
  const contribRaw = await getMuscleContributions(exercise);
  const muscleContributions = Object.entries(contribRaw)
    .map(([mg, weight]) => ({ muscleGroup: mg, label: labelFor(mg), weight }))
    .sort((a, b) => b.weight - a.weight);

  res.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      isCustom: exercise.isCustom,
      videoUrl: exercise.videoUrl,
      imageUrl: exercise.imageUrl,
      imageUrls: exercise.imageUrls,
      bodyParts: exercise.bodyParts,
      targetMuscles: exercise.targetMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      equipments: exercise.equipments,
      exerciseType: exercise.exerciseType,
      overview: exercise.overview,
      instructions: exercise.instructions,
      exerciseTips: exercise.exerciseTips,
      variations: exercise.variations,
      keywords: exercise.keywords,
    },
    muscleContributions,
    stats: {
      totalSets, totalReps, totalSessions: sessionList.length,
      totalVolume, maxWeight, best1RM, best5, best10,
      startingWeight: startingWeight ?? 0, currentBest,
      avgRir: rirCount ? +(rirSum / rirCount).toFixed(2) : null,
      avgRpe: rpeCount ? +(rpeSum / rpeCount).toFixed(2) : null,
      rirDistribution, rpeProgression,
    },
    prs,
    sessions: sessionList,
  });
}

export async function deleteExercise(req, res) {
  const { id } = req.params;
  const exercise = await prisma.exercise.findFirst({
    where: { id, userId: req.user.id, isCustom: true },
  });
  if (!exercise) throw httpError(404, 'Custom exercise not found');
  await prisma.exercise.delete({ where: { id } });
  res.json({ ok: true });
}
EOF
echo "✅ server/src/controllers/exercise.controller.js"

# ============================================================
# 5. client/src/components/MuscleRecoveryMap.jsx
# ============================================================
mkdir -p client/src/components
cat > client/src/components/MuscleRecoveryMap.jsx <<'EOF'
import { useState } from 'react';
import { fmtNumber } from '../lib/format.js';

const LABELS = {
  neck: 'Neck',
  traps: 'Traps',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest',
  chest: 'Chest',
  lats: 'Lats',
  middle_back: 'Middle Back',
  lower_back: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
};

function recoveryColor(percent, never) {
  if (never) return '#3a424f';
  if (percent >= 95) return '#c6ff3d';
  if (percent >= 75) return '#ffb038';
  if (percent >= 50) return '#ff8f3d';
  if (percent >= 25) return '#ff5e5e';
  return '#8a1f1f';
}

function recoveryStroke(percent, never) {
  if (never) return '#5a6470';
  if (percent >= 95) return '#9bd82f';
  if (percent >= 75) return '#d99230';
  if (percent >= 50) return '#d97830';
  if (percent >= 25) return '#d94e4e';
  return '#6a1515';
}

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function pctLabel(percent, never) {
  return never ? '—' : `${percent}%`;
}

export default function MuscleRecoveryMap({ recovery = [] }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const byGroup = {};
  for (const r of recovery) byGroup[r.muscleGroup] = r;

  const get = (g) => byGroup[g] || {
    muscleGroup: g, percent: 100, sets7d: 0, sets30d: 0,
    volume7d: 0, volume30d: 0, hoursRemaining: null, lastTrainedAt: null,
  };

  const active = hovered || selected;
  const activeData = active ? get(active) : null;
  const activeNever = activeData ? !activeData.lastTrainedAt : false;

  const fillFor = (g) => {
    const r = get(g);
    const never = !r.lastTrainedAt;
    const base = recoveryColor(r.percent, never);
    if (active === g) return base;
    if (active && active !== g) return `${base}55`;
    return base;
  };

  const strokeFor = (g) => recoveryStroke(get(g).percent, !get(g).lastTrainedAt);

  const handlers = (g) => ({
    onMouseEnter: () => setHovered(g),
    onMouseLeave: () => setHovered(null),
    onClick: () => setSelected((s) => (s === g ? null : g)),
    style: { cursor: 'pointer', transition: 'fill 200ms, opacity 200ms' },
  });

  const labelText = (g) => pctLabel(get(g).percent, !get(g).lastTrainedAt);

  const allGroups = [
    'neck', 'traps',
    'front_delt', 'side_delt', 'rear_delt',
    'upper_chest', 'chest',
    'lats', 'middle_back', 'lower_back',
    'biceps', 'triceps', 'forearms',
    'abs', 'obliques',
    'glutes', 'quads', 'hamstrings', 'calves',
  ];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">Muscle Recovery Map</div>
        <div className="flex items-center gap-2 text-[10px] text-ink-400">
          <span className="w-3 h-3 rounded" style={{ background: '#8a1f1f' }} />
          <span>Fatigued</span>
          <span className="w-3 h-3 rounded" style={{ background: '#ffb038' }} />
          <span>Recovering</span>
          <span className="w-3 h-3 rounded" style={{ background: '#c6ff3d' }} />
          <span>Ready</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* SVG bodies */}
        <div className="flex justify-center gap-3 flex-wrap">
          {/* FRONT */}
          <svg viewBox="0 0 140 320" width="180" height="400" className="shrink-0">
            <defs>
              <style>{`.lb { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            {/* Head */}
            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="70" cy="20" r="12" />
            </g>

            {/* Neck */}
            <rect x="63" y="30" width="14" height="10" rx="2"
              fill={fillFor('neck')} stroke={strokeFor('neck')} strokeWidth="1"
              {...handlers('neck')} />
            <text className="lb" x="70" y="38">{labelText('neck')}</text>

            {/* Front delts (2 bên) */}
            <path d="M 48 42 Q 38 44 36 54 L 40 66 Q 48 62 56 62 L 56 44 Q 52 42 48 42 Z"
              fill={fillFor('front_delt')} stroke={strokeFor('front_delt')} strokeWidth="1"
              {...handlers('front_delt')} />
            <path d="M 92 42 Q 102 44 104 54 L 100 66 Q 92 62 84 62 L 84 44 Q 88 42 92 42 Z"
              fill={fillFor('front_delt')} stroke={strokeFor('front_delt')} strokeWidth="1"
              {...handlers('front_delt')} />
            <text className="lb" x="46" y="56">{labelText('front_delt')}</text>

            {/* Upper chest */}
            <path d="M 52 64 Q 60 62 70 62 Q 80 62 88 64 L 86 78 L 70 80 L 54 78 Z"
              fill={fillFor('upper_chest')} stroke={strokeFor('upper_chest')} strokeWidth="1"
              {...handlers('upper_chest')} />
            <text className="lb" x="70" y="74">{labelText('upper_chest')}</text>

            {/* Mid/lower chest */}
            <path d="M 54 80 L 86 80 L 84 96 Q 78 102 70 102 Q 62 102 56 96 Z"
              fill={fillFor('chest')} stroke={strokeFor('chest')} strokeWidth="1"
              {...handlers('chest')} />
            <text className="lb" x="70" y="94">{labelText('chest')}</text>

            {/* Biceps L */}
            <path d="M 32 68 Q 26 72 26 84 L 28 104 Q 34 104 36 94 L 36 70 Q 34 68 32 68 Z"
              fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth="1"
              {...handlers('biceps')} />
            {/* Biceps R */}
            <path d="M 108 68 Q 114 72 114 84 L 112 104 Q 106 104 104 94 L 104 70 Q 106 68 108 68 Z"
              fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth="1"
              {...handlers('biceps')} />
            <text className="lb" x="30" y="88">{labelText('biceps')}</text>

            {/* Forearms L/R */}
            <path d="M 28 108 L 36 108 L 34 130 L 30 130 Z"
              fill={fillFor('forearms')} stroke={strokeFor('forearms')} strokeWidth="1"
              {...handlers('forearms')} />
            <path d="M 104 108 L 112 108 L 110 130 L 106 130 Z"
              fill={fillFor('forearms')} stroke={strokeFor('forearms')} strokeWidth="1"
              {...handlers('forearms')} />
            <text className="lb" x="32" y="122">{labelText('forearms')}</text>

            {/* Abs */}
            <rect x="58" y="104" width="24" height="40" rx="2"
              fill={fillFor('abs')} stroke={strokeFor('abs')} strokeWidth="1"
              {...handlers('abs')} />
            <text className="lb" x="70" y="128">{labelText('abs')}</text>

            {/* Obliques (2 bên) */}
            <path d="M 56 106 L 56 140 L 50 138 L 50 108 Z"
              fill={fillFor('obliques')} stroke={strokeFor('obliques')} strokeWidth="1"
              {...handlers('obliques')} />
            <path d="M 84 106 L 84 140 L 90 138 L 90 108 Z"
              fill={fillFor('obliques')} stroke={strokeFor('obliques')} strokeWidth="1"
              {...handlers('obliques')} />

            {/* Quads */}
            <path d="M 54 146 L 68 146 L 66 210 L 56 210 Z"
              fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth="1"
              {...handlers('quads')} />
            <path d="M 72 146 L 86 146 L 84 210 L 74 210 Z"
              fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth="1"
              {...handlers('quads')} />
            <text className="lb" x="70" y="180">{labelText('quads')}</text>

            {/* Calves front (tibialis) */}
            <path d="M 58 218 L 66 218 L 66 250 L 58 250 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <path d="M 74 218 L 82 218 L 82 250 L 74 250 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <text className="lb" x="70" y="238">{labelText('calves')}</text>

            <text x="70" y="272" textAnchor="middle" fontSize="7" fill="#8a93a0">FRONT</text>
          </svg>

          {/* BACK */}
          <svg viewBox="0 0 140 320" width="180" height="400" className="shrink-0">
            <defs>
              <style>{`.lb2 { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="70" cy="20" r="12" />
            </g>

            {/* Neck back */}
            <rect x="63" y="30" width="14" height="10" rx="2"
              fill={fillFor('neck')} stroke={strokeFor('neck')} strokeWidth="1"
              {...handlers('neck')} />
            <text className="lb2" x="70" y="38">{labelText('neck')}</text>

            {/* Traps */}
            <path d="M 48 42 L 92 42 L 90 66 Q 80 72 70 72 Q 60 72 50 66 Z"
              fill={fillFor('traps')} stroke={strokeFor('traps')} strokeWidth="1"
              {...handlers('traps')} />
            <text className="lb2" x="70" y="58">{labelText('traps')}</text>

            {/* Rear delts */}
            <path d="M 46 68 Q 36 70 34 80 L 38 92 Q 44 90 50 84 L 50 68 Z"
              fill={fillFor('rear_delt')} stroke={strokeFor('rear_delt')} strokeWidth="1"
              {...handlers('rear_delt')} />
            <path d="M 94 68 Q 104 70 106 80 L 102 92 Q 96 90 90 84 L 90 68 Z"
              fill={fillFor('rear_delt')} stroke={strokeFor('rear_delt')} strokeWidth="1"
              {...handlers('rear_delt')} />

            {/* Lats (2 bên) */}
            <path d="M 46 74 Q 44 92 48 108 L 62 110 L 62 76 Q 54 74 46 74 Z"
              fill={fillFor('lats')} stroke={strokeFor('lats')} strokeWidth="1"
              {...handlers('lats')} />
            <path d="M 94 74 Q 96 92 92 108 L 78 110 L 78 76 Q 86 74 94 74 Z"
              fill={fillFor('lats')} stroke={strokeFor('lats')} strokeWidth="1"
              {...handlers('lats')} />
            <text className="lb2" x="55" y="94">{labelText('lats')}</text>

            {/* Middle back */}
            <path d="M 62 76 L 78 76 L 78 106 L 62 106 Z"
              fill={fillFor('middle_back')} stroke={strokeFor('middle_back')} strokeWidth="1"
              {...handlers('middle_back')} />
            <text className="lb2" x="70" y="94">{labelText('middle_back')}</text>

            {/* Lower back */}
            <path d="M 62 108 L 78 108 L 78 138 L 62 138 Z"
              fill={fillFor('lower_back')} stroke={strokeFor('lower_back')} strokeWidth="1"
              {...handlers('lower_back')} />
            <text className="lb2" x="70" y="126">{labelText('lower_back')}</text>

            {/* Triceps L/R */}
            <path d="M 32 74 Q 26 78 26 90 L 28 106 Q 34 106 36 96 L 36 74 Z"
              fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth="1"
              {...handlers('triceps')} />
            <path d="M 108 74 Q 114 78 114 90 L 112 106 Q 106 106 104 96 L 104 74 Z"
              fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth="1"
              {...handlers('triceps')} />
            <text className="lb2" x="30" y="92">{labelText('triceps')}</text>

            {/* Glutes */}
            <path d="M 54 146 Q 70 142 86 146 L 86 172 Q 70 178 54 172 Z"
              fill={fillFor('glutes')} stroke={strokeFor('glutes')} strokeWidth="1"
              {...handlers('glutes')} />
            <text className="lb2" x="70" y="164">{labelText('glutes')}</text>

            {/* Hamstrings */}
            <path d="M 54 176 L 68 176 L 66 218 L 56 218 Z"
              fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth="1"
              {...handlers('hamstrings')} />
            <path d="M 72 176 L 86 176 L 84 218 L 74 218 Z"
              fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth="1"
              {...handlers('hamstrings')} />
            <text className="lb2" x="70" y="200">{labelText('hamstrings')}</text>

            {/* Calves back */}
            <path d="M 58 224 L 66 224 L 66 256 L 58 256 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <path d="M 74 224 L 82 224 L 82 256 L 74 256 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <text className="lb2" x="70" y="244">{labelText('calves')}</text>

            <text x="70" y="272" textAnchor="middle" fontSize="7" fill="#8a93a0">BACK</text>
          </svg>
        </div>

        {/* Detail panel */}
        <div className="space-y-3 min-w-0">
          {active && activeData ? (
            <div className="border border-ink-700 rounded-lg p-3 space-y-2 bg-ink-850">
              <div className="flex items-center justify-between">
                <div className="font-medium">{LABELS[active] || active}</div>
                <div className="text-sm font-semibold"
                  style={{ color: recoveryColor(activeData.percent, activeNever) }}>
                  {activeNever ? 'Never trained' : `${activeData.percent}% recovered`}
                </div>
              </div>
              <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${activeNever ? 0 : activeData.percent}%`,
                    background: recoveryColor(activeData.percent, activeNever),
                  }} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-400">Sets 7d</span>
                  <span>{activeData.sets7d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Sets 30d</span>
                  <span>{activeData.sets30d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Vol 7d</span>
                  <span>{fmtNumber((activeData.volume7d || 0) / 1000, 1)}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Vol 30d</span>
                  <span>{fmtNumber((activeData.volume30d || 0) / 1000, 1)}t</span>
                </div>
                {!activeNever && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Last</span>
                      <span>{activeData.hoursSince != null ? `${fmtHours(activeData.hoursSince)} ago` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">ETA</span>
                      <span>{activeData.percent >= 100 ? 'Ready' : fmtHours(activeData.hoursRemaining)}</span>
                    </div>
                  </>
                )}
              </div>
              {selected && (
                <button className="btn btn-ghost w-full text-xs justify-center" onClick={() => setSelected(null)}>
                  Close
                </button>
              )}
            </div>
          ) : (
            <div className="border border-ink-700 rounded-lg p-3 text-sm text-ink-400">
              Hover hoặc click vào vùng cơ trên hình để xem chi tiết.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allGroups.map((g) => {
              const r = get(g);
              const never = !r.lastTrainedAt;
              return (
                <button
                  key={g}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                    active === g ? 'border-accent' : 'border-ink-700 hover:border-ink-500'
                  }`}
                  onMouseEnter={() => setHovered(g)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected((s) => (s === g ? null : g))}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: recoveryColor(r.percent, never) }} />
                    <span className="truncate">{LABELS[g] || g}</span>
                  </div>
                  <span className="font-medium shrink-0 ml-2"
                    style={{ color: recoveryColor(r.percent, never) }}>
                    {pctLabel(r.percent, never)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF
echo "✅ client/src/components/MuscleRecoveryMap.jsx"

# ============================================================
# 6. client/src/pages/ExerciseDetail.jsx (thêm muscle breakdown)
# ============================================================
mkdir -p client/src/pages
cat > client/src/pages/ExerciseDetail.jsx <<'EOF'
import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import StrengthLevelCard from '../components/StrengthLevelCard.jsx';
import { fmtDate, fmtNumber } from '../lib/format.js';

const TABS = ['Overview', 'History', 'Progression', 'Intensity', 'PRs'];
const RANGES = { '30D': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 99999 };

const CONTRIB_COLORS = {
  neck: '#ffb038',
  traps: '#c6ff3d',
  front_delt: '#5ed3ff',
  side_delt: '#3aa0ff',
  rear_delt: '#7b8cff',
  upper_chest: '#ff8f3d',
  chest: '#ff5e5e',
  lats: '#b494ff',
  middle_back: '#9066ff',
  lower_back: '#6a4dd8',
  biceps: '#ffa8d8',
  triceps: '#ff6ec7',
  forearms: '#d8a8ff',
  abs: '#88e0c0',
  obliques: '#5ec9a8',
  glutes: '#ffd166',
  quads: '#f7b801',
  hamstrings: '#e07a00',
  calves: '#c6a15b',
};

function contribColor(mg) {
  return CONTRIB_COLORS[mg] || '#8a93a0';
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('Overview');
  const [range, setRange] = useState('3M');
  const { data, loading, error, refresh } = useFetch(
    () => api.get(`/exercises/${id}`),
    [id]
  );

  const progression = useMemo(() => {
    if (!data?.sessions) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGES[range]);
    const byDay = new Map();
    for (const sess of data.sessions) {
      if (new Date(sess.date) < cutoff) continue;
      const k = new Date(sess.date).toISOString().slice(0, 10);
      if (!byDay.has(k)) byDay.set(k, { date: k, maxWeight: 0, volume: 0, reps: 0, estimated1RM: 0 });
      const d = byDay.get(k);
      for (const s of sess.sets) {
        if (s.weight > d.maxWeight) d.maxWeight = s.weight;
        d.volume += s.weight * s.reps;
        d.reps += s.reps;
        if (s.estimated1RM && s.estimated1RM > d.estimated1RM) d.estimated1RM = s.estimated1RM;
      }
    }
    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [data, range]);

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
  if (error) return (
    <div className="card p-4 text-red-400 text-sm">
      {error}{' '}
      <button className="underline ml-2" onClick={refresh}>Retry</button>
    </div>
  );
  if (!data?.exercise) return <Empty title="Exercise not found" />;

  const { exercise, stats, prs, sessions, muscleContributions = [] } = data;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h1 className="text-2xl font-semibold">{exercise.name}</h1>
        <div className="text-sm text-ink-400 capitalize">
          {exercise.muscleGroup} · {exercise.equipment || '—'}
          {exercise.exerciseType ? ` · ${exercise.exerciseType}` : ''}
        </div>
        {exercise.overview && (
          <p className="text-sm text-ink-300 mt-3">{exercise.overview}</p>
        )}
      </div>

      {muscleContributions.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-3">Muscles Worked</div>
          <div className="space-y-2">
            {muscleContributions.map((c) => (
              <div key={c.muscleGroup}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{c.label}</span>
                  <span className="text-ink-400">
                    {Math.round(c.weight * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${c.weight * 100}%`,
                      background: contribColor(c.muscleGroup),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <StrengthLevelCard exerciseId={exercise.id} />

      {exercise.videoUrl && (
        <div className="card p-0 overflow-hidden">
          <video src={exercise.videoUrl} controls autoPlay loop muted playsInline
            className="w-full max-h-[600px] bg-black" />
        </div>
      )}

      {!exercise.videoUrl && exercise.imageUrl && (
        <div className="card p-0 overflow-hidden">
          <img src={exercise.imageUrl} alt={exercise.name}
            className="w-full max-h-[500px] object-cover bg-ink-800" />
        </div>
      )}

      {Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Cách thực hiện</div>
          <ol className="list-decimal ml-5 text-sm text-ink-300 space-y-1">
            {exercise.instructions.map((s, i) => (<li key={i}>{s}</li>))}
          </ol>
        </div>
      )}

      {Array.isArray(exercise.exerciseTips) && exercise.exerciseTips.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Tips</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.exerciseTips.map((s, i) => (<li key={i}>{s}</li>))}
          </ul>
        </div>
      )}

      {Array.isArray(exercise.variations) && exercise.variations.length > 0 && (
        <div className="card p-4">
          <div className="font-semibold mb-2">Biến thể</div>
          <ul className="list-disc ml-5 text-sm text-ink-300 space-y-1">
            {exercise.variations.map((s, i) => (<li key={i}>{s}</li>))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Current Best" value={`${stats.currentBest}kg`} />
        <StatCard label="Starting" value={`${stats.startingWeight}kg`} />
        <StatCard label="Best 1RM (est)" value={`${fmtNumber(stats.best1RM, 1)}kg`} />
        <StatCard label="Best 5 reps" value={`${stats.best5}kg`} />
        <StatCard label="Best 10 reps" value={`${stats.best10}kg`} />
        <StatCard label="Total Sets" value={stats.totalSets} />
        <StatCard label="Total Reps" value={fmtNumber(stats.totalReps)} />
        <StatCard label="Sessions" value={stats.totalSessions} />
      </div>

      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm whitespace-nowrap ${
              tab === t ? 'text-accent border-b-2 border-accent' : 'text-ink-400 hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            {Object.keys(RANGES).map((r) => (
              <button key={r}
                className={`chip ${range === r ? 'border-accent text-accent' : ''}`}
                onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Weight over time</div>
              <LineChartCard data={progression} lines={[{ key: 'maxWeight', name: 'kg' }]} />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Estimated 1RM over time</div>
              <LineChartCard data={progression}
                lines={[{ key: 'estimated1RM', name: '1RM', color: '#ffb038' }]} />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Volume over time</div>
              <LineChartCard data={progression}
                lines={[{ key: 'volume', name: 'kg', color: '#5ed3ff' }]} />
            </div>
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">Reps over time</div>
              <LineChartCard data={progression}
                lines={[{ key: 'reps', name: 'reps', color: '#b494ff' }]} />
            </div>
          </div>
        </div>
      )}

      {tab === 'History' && (
        sessions.length ? (
          <div className="space-y-2">
            {[...sessions].reverse().map((s) => (
              <div key={s.workoutId} className="card p-4">
                <div className="flex justify-between mb-2">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-ink-400">{fmtDate(s.date)}</div>
                </div>
                <div className="text-xs text-ink-300 space-y-0.5">
                  {s.sets.map((set, i) => (
                    <div key={set.id}>
                      {i + 1}. {set.weight}kg × {set.reps}
                      {set.rir != null ? ` (RIR ${set.rir})` : ''}
                      {set.rpe != null ? ` (RPE ${set.rpe})` : ''}
                      {set.estimated1RM ? ` · ${set.estimated1RM.toFixed(1)} 1RM` : ''}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : <Empty title="No history yet" />
      )}

      {tab === 'Progression' && (
        <div className="card p-4">
          <div className="text-sm mb-2 text-ink-300">Weight progression</div>
          <LineChartCard data={progression}
            lines={[{ key: 'maxWeight', name: 'kg' }]} height={320} />
        </div>
      )}

      {tab === 'Intensity' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Avg RIR"
              value={stats.avgRir != null ? stats.avgRir.toFixed(2) : '—'}
              sub="Lower = closer to failure" />
            <StatCard label="Avg RPE"
              value={stats.avgRpe != null ? stats.avgRpe.toFixed(2) : '—'}
              sub="10 = max effort" />
          </div>
          {stats.rpeProgression?.length > 0 ? (
            <div className="card p-4">
              <div className="text-sm mb-2 text-ink-300">RIR / RPE over time</div>
              <LineChartCard data={stats.rpeProgression} xKey="date"
                lines={[
                  { key: 'avgRir', name: 'RIR', color: '#c6ff3d' },
                  { key: 'avgRpe', name: 'RPE', color: '#5ed3ff' },
                ]} height={320} />
            </div>
          ) : <Empty title="No RIR/RPE data" hint="Log RIR or RPE in sets to see trend." />}

          {Object.keys(stats.rirDistribution || {}).length > 0 && (
            <div className="card p-4">
              <div className="font-semibold mb-3">RIR Distribution</div>
              <div className="space-y-2">
                {Object.entries(stats.rirDistribution)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([rir, count]) => {
                    const max = Math.max(...Object.values(stats.rirDistribution));
                    return (
                      <div key={rir}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>RIR {rir}{rir === '0' && ' (failure)'}</span>
                          <span className="text-ink-400">{count} sets</span>
                        </div>
                        <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full"
                            style={{ width: `${(count / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'PRs' && (
        prs.length ? (
          <div className="space-y-2">
            {prs.map((p) => (
              <div key={p.id} className="card p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm capitalize">{p.type.replace('_', ' ')}</div>
                  <div className="text-xs text-ink-400">
                    {fmtDate(p.achievedAt)}
                    {p.reps ? ` · ${p.weight}kg × ${p.reps}` : ''}
                  </div>
                </div>
                <div className="text-accent font-semibold">{fmtNumber(p.value, 1)}</div>
              </div>
            ))}
          </div>
        ) : <Empty title="No PRs yet" />
      )}
    </div>
  );
}
EOF
echo "✅ client/src/pages/ExerciseDetail.jsx"

echo ""
echo "=============================================="
echo "✅ FEATURE 8 hoàn tất — Muscle Map chi tiết"
echo "=============================================="
echo ""
echo "Deploy:"
echo "  cd ~/Code/tgr"
echo "  git add ."
echo "  git commit -m 'Feature 8: Detailed muscle map + exercise contribution'"
echo "  git push"
echo ""
echo "Không cần migration mới (chỉ thêm file JSON + logic)."
echo ""