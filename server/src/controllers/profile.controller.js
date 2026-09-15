import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';

export async function getProfile(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      googleId: true,
      emailVerified: true,
      createdAt: true,
      passwordHash: true,
    },
  });
  const { passwordHash, ...rest } = user;
  res.json({ user: { ...rest, hasPassword: !!passwordHash } });
}

export async function updateProfile(req, res) {
  const { name, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, avatarUrl },
    select: { id: true, email: true, name: true, avatarUrl: true },
  });
  res.json({ user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) throw httpError(400, 'Password min 8 chars');
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user.passwordHash) {
    const ok = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!ok) throw httpError(401, 'Current password incorrect');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  res.json({ ok: true });
}

export async function getSchedule(req, res) {
  const userId = req.user.id;
  const schedule = await prisma.trainingSchedule.findMany({
    where: { userId },
    orderBy: { weekday: 'asc' },
  });
  res.json({ schedule });
}

export async function setSchedule(req, res) {
  const userId = req.user.id;
  const { weekday, workoutType, isPlanned } = req.body;
  if (weekday == null || !workoutType) throw httpError(400, 'weekday and workoutType required');

  const existing = await prisma.trainingSchedule.findFirst({
    where: { userId, weekday },
  });

  const schedule = existing
    ? await prisma.trainingSchedule.update({
        where: { id: existing.id },
        data: { workoutType, isPlanned: isPlanned ?? true },
      })
    : await prisma.trainingSchedule.create({
        data: { userId, weekday, workoutType, isPlanned: isPlanned ?? true },
      });

  res.json({ schedule });
}