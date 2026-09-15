import { prisma } from '../utils/prisma.js';
import { epley1RM, volume } from '../utils/calc.js';

async function computeBestSets(userId, exerciseId = null) {
  const where = { workoutExercise: { workout: { userId } } };
  if (exerciseId) where.workoutExercise.exerciseId = exerciseId;

  const sets = await prisma.workoutSet.findMany({
    where,
    include: {
      workoutExercise: {
        include: {
          workout: { select: { id: true, date: true } },
          exercise: { select: { id: true, name: true, muscleGroup: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const best = new Map();

  const consider = (key, value, meta) => {
    if (value == null || !Number.isFinite(value)) return;
    const cur = best.get(key);
    if (!cur || value > cur.value) {
      best.set(key, {
        id: `${meta.exerciseId}-${meta.type}`,
        exerciseId: meta.exerciseId,
        exercise: meta.exercise,
        type: meta.type,
        value,
        reps: meta.reps,
        weight: meta.weight,
        achievedAt: meta.achievedAt,
      });
    }
  };

  for (const s of sets) {
    const ex = s.workoutExercise.exercise;
    const at = s.workoutExercise.workout.date;
    const base = {
      exerciseId: ex.id,
      exercise: { id: ex.id, name: ex.name, muscleGroup: ex.muscleGroup },
      reps: s.reps,
      weight: s.weight,
      achievedAt: at,
    };

    consider(`${ex.id}:max_weight`, s.weight, { ...base, type: 'max_weight' });
    consider(`${ex.id}:max_reps`, s.reps, { ...base, type: 'max_reps' });
    consider(`${ex.id}:max_volume`, volume(s.weight, s.reps), { ...base, type: 'max_volume' });

    const est = s.estimated1RM ?? epley1RM(s.weight, s.reps);
    if (est != null && s.reps > 0 && s.reps <= 20) {
      consider(`${ex.id}:estimated_1rm`, est, { ...base, type: 'estimated_1rm' });
    }
  }

  return [...best.values()];
}

export async function listPRs(req, res) {
  const userId = req.user.id;
  const { exerciseId } = req.query;
  const prs = await computeBestSets(userId, exerciseId || null);
  prs.sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));
  res.json({ prs });
}

export async function recentPRs(req, res) {
  const userId = req.user.id;
  const prs = await computeBestSets(userId);
  prs.sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));
  res.json({ prs: prs.slice(0, 20) });
}

export async function bestByExercise(req, res) {
  const userId = req.user.id;
  const prs = await computeBestSets(userId);
  prs.sort((a, b) => b.value - a.value);
  res.json({ prs });
}