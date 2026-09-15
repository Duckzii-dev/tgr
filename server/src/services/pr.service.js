import { prisma } from '../utils/prisma.js';
import { epley1RM, volume } from '../utils/calc.js';

export async function evaluatePRs({ userId, exerciseId, weight, reps, achievedAt, workoutId }) {
  const w = Number(weight);
  const r = Number(reps);
  const est = epley1RM(w, r);
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
      workoutExercise: {
        exerciseId,
        workout: { userId, ...(workoutId ? { NOT: { id: workoutId } } : {}) },
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
    const e = s.estimated1RM ?? epley1RM(s.weight, s.reps);
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