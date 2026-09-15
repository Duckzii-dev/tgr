import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { isoWeek } from '../utils/calc.js';

async function computeCurrent(goal, userId) {
  switch (goal.type) {
    case 'exercise_pr': {
      const best = await prisma.workoutSet.findFirst({
        where: {
          workoutExercise: { exerciseId: goal.exerciseId, workout: { userId } },
        },
        orderBy: { weight: 'desc' },
        select: { weight: true },
      });
      return best?.weight || 0;
    }
    case 'bodyweight': {
      const bw = await prisma.bodyWeight.findFirst({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
      });
      return bw?.weight || 0;
    }
    case 'workout_count':
      return prisma.workout.count({ where: { userId } });
    case 'gym_hours': {
      const w = await prisma.workout.findMany({
        where: { userId },
        select: { duration: true },
      });
      const total = w.reduce((s, x) => s + (x.duration || 0), 0);
      return +(total / 3600).toFixed(2);
    }
    case 'volume': {
      const sets = await prisma.workoutSet.findMany({
        where: { workoutExercise: { workout: { userId } } },
      });
      return sets.reduce((s, x) => s + x.weight * x.reps, 0);
    }
    case 'consistency': {
      const w = await prisma.workout.findMany({
        where: { userId },
        select: { date: true },
      });
      return new Set(w.map((x) => isoWeek(x.date))).size;
    }
    default:
      return 0;
  }
}

export async function listGoals(req, res) {
  const userId = req.user.id;
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const enriched = await Promise.all(
    goals.map(async (g) => {
      const current = await computeCurrent(g, userId);
      const progress = g.target ? Math.min(100, (current / g.target) * 100) : 0;
      await prisma.goal.update({ where: { id: g.id }, data: { current } });
      return {
        ...g,
        current,
        progress: +progress.toFixed(1),
        remaining: Math.max(0, g.target - current),
      };
    })
  );
  res.json({ goals: enriched });
}

export async function createGoal(req, res) {
  const userId = req.user.id;
  const { type, title, target, unit, exerciseId, deadline } = req.body;
  if (!type || !title || !target) throw httpError(400, 'type, title, target required');
  const goal = await prisma.goal.create({
    data: {
      userId,
      type,
      title,
      target: Number(target),
      unit,
      exerciseId: exerciseId || null,
      deadline: deadline ? new Date(deadline) : null,
    },
  });
  res.status(201).json({ goal });
}

export async function updateGoal(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const ex = await prisma.goal.findFirst({ where: { id, userId } });
  if (!ex) throw httpError(404, 'Goal not found');
  const { title, target, unit, deadline } = req.body;
  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: title ?? ex.title,
      target: target != null ? Number(target) : ex.target,
      unit: unit ?? ex.unit,
      deadline: deadline ? new Date(deadline) : ex.deadline,
    },
  });
  res.json({ goal });
}

export async function deleteGoal(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const ex = await prisma.goal.findFirst({ where: { id, userId } });
  if (!ex) throw httpError(404, 'Goal not found');
  await prisma.goal.delete({ where: { id } });
  res.json({ ok: true });
}