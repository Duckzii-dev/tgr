import { prisma } from '../utils/prisma.js';
import { epley1RM, volume } from '../utils/calc.js';

export async function evaluatePRs({
  userId,
  exerciseId,
  weight,
  reps,
  rir = null,
  achievedAt,
  excludeWorkoutId,
}) {
  const w = Number(weight);
  const r = Number(reps);
  const est = epley1RM(w, r, rir ?? null);
  const vol = volume(w, r);

  const candidates = [
    { type: 'max_weight', value: w, reps: r, weight: w },
    { type: 'max_reps', value: r, reps: r, weight: w },
    { type: 'max_volume', value: vol, reps: r, weight: w },
  ];
  if (est != null && r > 0 && r <= 20) {
    candidates.push({ type: 'estimated_1rm', value: est, reps: r, weight: w });
  }

  const priorSets = await prisma.workoutSet.findMany({
    where: {
      isWarmup: false,
      workoutExercise: {
        exerciseId,
        workout: {
          userId,
          ...(excludeWorkoutId ? { NOT: { id: excludeWorkoutId } } : {}),
        },
      },
    },
    select: { weight: true, reps: true, estimated1RM: true },
  });

  const priorBest = {
    max_weight: 0,
    max_reps: 0,
    max_volume: 0,
    estimated_1rm: 0,
  };
  for (const s of priorSets) {
    if (s.weight > priorBest.max_weight) priorBest.max_weight = s.weight;
    if (s.reps > priorBest.max_reps) priorBest.max_reps = s.reps;
    const v = volume(s.weight, s.reps);
    if (v > priorBest.max_volume) priorBest.max_volume = v;
    const e = s.estimated1RM ?? epley1RM(s.weight, s.reps, s.rir ?? null);
    if (e != null && e > priorBest.estimated_1rm) priorBest.estimated_1rm = e;
  }

  const newPRs = [];
  for (const c of candidates) {
    if (c.value > (priorBest[c.type] || 0)) {
      newPRs.push({
        type: c.type,
        value: c.value,
        reps: c.reps,
        weight: c.weight,
        achievedAt: achievedAt ? new Date(achievedAt) : new Date(),
      });
    }
  }
  return newPRs;
}

export async function persistPRs({ userId, exerciseId, workoutId, prs }) {
  if (!prs.length) return [];
  const created = [];
  for (const p of prs) {
    const row = await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_type: {
          userId,
          exerciseId,
          type: p.type,
        },
      },
      create: {
        userId,
        exerciseId,
        workoutId: workoutId || null,
        type: p.type,
        value: p.value,
        reps: p.reps ?? null,
        weight: p.weight ?? null,
        achievedAt: p.achievedAt,
      },
      update: {
        value: p.value,
        reps: p.reps ?? null,
        weight: p.weight ?? null,
        achievedAt: p.achievedAt,
        workoutId: workoutId || null,
      },
    });
    created.push(row);
  }
  return created;
}

export async function clearPRsForWorkout(workoutId) {
  await prisma.personalRecord.deleteMany({ where: { workoutId } });
}

export async function rebuildAllPRs(userId) {
  await prisma.personalRecord.deleteMany({ where: { userId } });

  const sets = await prisma.workoutSet.findMany({
    where: { isWarmup: false, workoutExercise: { workout: { userId } } },
    include: {
      workoutExercise: {
        include: {
          workout: { select: { id: true, date: true } },
        },
      },
    },
    orderBy: [
      { workoutExercise: { workout: { date: 'asc' } } },
      { setNumber: 'asc' },
    ],
  });

  const bestByExercise = new Map();

  for (const s of sets) {
    const exId = s.workoutExercise.exerciseId;
    const at = s.workoutExercise.workout.date;
    const workoutId = s.workoutExercise.workout.id;
    const w = s.weight;
    const r = s.reps;
    const est = s.estimated1RM ?? epley1RM(w, r);
    const vol = volume(w, r);

    const candidates = [
      { type: 'max_weight', value: w, reps: r, weight: w },
      { type: 'max_reps', value: r, reps: r, weight: w },
      { type: 'max_volume', value: vol, reps: r, weight: w },
    ];
    if (est != null && r > 0 && r <= 20) {
      candidates.push({ type: 'estimated_1rm', value: est, reps: r, weight: w });
    }

    for (const c of candidates) {
      const key = `${exId}:${c.type}`;
      const cur = bestByExercise.get(key);
      if (!cur || c.value > cur.value) {
        bestByExercise.set(key, { ...c, achievedAt: at, workoutId });
      }
    }
  }

  let count = 0;
  for (const [key, v] of bestByExercise.entries()) {
    const [exerciseId, type] = key.split(':');
    await prisma.personalRecord.create({
      data: {
        userId,
        exerciseId,
        workoutId: v.workoutId,
        type,
        value: v.value,
        reps: v.reps ?? null,
        weight: v.weight ?? null,
        achievedAt: v.achievedAt,
      },
    });
    count++;
  }
  return count;
}
