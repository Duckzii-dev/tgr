import { prisma } from '../utils/prisma.js';

/**
 * Đọc PR đã persist từ bảng PersonalRecord.
 * Nếu bảng trống (user cũ chưa finish workout lần nào) → fallback tính runtime.
 */
export async function listPRs(req, res) {
  const userId = req.user.id;
  const { exerciseId } = req.query;

  const prs = await prisma.personalRecord.findMany({
    where: { userId, ...(exerciseId ? { exerciseId } : {}) },
    include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
    orderBy: { achievedAt: 'desc' },
  });

  res.json({
    prs: prs.map((p) => ({
      id: p.id,
      exerciseId: p.exerciseId,
      exercise: p.exercise,
      type: p.type,
      value: p.value,
      reps: p.reps,
      weight: p.weight,
      achievedAt: p.achievedAt,
      workoutId: p.workoutId,
    })),
  });
}

export async function recentPRs(req, res) {
  const userId = req.user.id;
  const prs = await prisma.personalRecord.findMany({
    where: { userId },
    include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
    orderBy: { achievedAt: 'desc' },
    take: 20,
  });
  res.json({
    prs: prs.map((p) => ({
      id: p.id,
      exerciseId: p.exerciseId,
      exercise: p.exercise,
      type: p.type,
      value: p.value,
      reps: p.reps,
      weight: p.weight,
      achievedAt: p.achievedAt,
      workoutId: p.workoutId,
    })),
  });
}

export async function bestByExercise(req, res) {
  const userId = req.user.id;
  const prs = await prisma.personalRecord.findMany({
    where: { userId },
    include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
    orderBy: { value: 'desc' },
  });
  res.json({
    prs: prs.map((p) => ({
      id: p.id,
      exerciseId: p.exerciseId,
      exercise: p.exercise,
      type: p.type,
      value: p.value,
      reps: p.reps,
      weight: p.weight,
      achievedAt: p.achievedAt,
      workoutId: p.workoutId,
    })),
  });
}