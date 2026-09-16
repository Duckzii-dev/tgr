import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { writeAudit } from '../services/audit.service.js';
import { getClientIp } from '../middleware/ipblock.middleware.js';
import { volume } from '../utils/calc.js';

// ============================================================
// DASHBOARD
// ============================================================

export async function stats(req, res) {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  const [
    totalUsers,
    activeUsers24h,
    activeUsers7d,
    bannedUsers,
    totalWorkouts,
    totalSets,
    totalExercises,
    totalBlocks,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { lastLoginAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { lastLoginAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { isBanned: true } }),
    prisma.workout.count(),
    prisma.workoutSet.count(),
    prisma.exercise.count({ where: { userId: null } }),
    prisma.ipBlock.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  res.json({
    users: {
      total: totalUsers,
      active24h: activeUsers24h,
      active7d: activeUsers7d,
      banned: bannedUsers,
      newThisWeek: recentSignups,
    },
    workouts: { total: totalWorkouts, sets: totalSets },
    exercises: { total: totalExercises },
    ipBlocks: { total: totalBlocks },
  });
}

// ============================================================
// USERS
// ============================================================

export async function listUsers(req, res) {
  const {
    q,
    role,
    banned,
    sort = 'createdAt',
    order = 'desc',
    limit = '50',
    offset = '0',
  } = req.query;

  const take = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = Math.max(0, Number(offset) || 0);

  const where = {};
  if (q) {
    where.OR = [
      { email: { contains: q } },
      { name: { contains: q } },
      { id: { contains: q } },
    ];
  }
  if (role) where.role = role;
  if (banned === 'true') where.isBanned = true;
  if (banned === 'false') where.isBanned = false;

  const orderBy = {};
  const allowedSort = ['createdAt', 'lastLoginAt', 'email', 'name'];
  orderBy[allowedSort.includes(sort) ? sort : 'createdAt'] =
    order === 'asc' ? 'asc' : 'desc';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        lastLoginAt: true,
        lastLoginIp: true,
        googleId: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            workouts: true,
            bodyWeights: true,
            goals: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, limit: take, offset: skip });
}

export async function getUser(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isBanned: true,
      bannedAt: true,
      bannedReason: true,
      lastLoginAt: true,
      lastLoginIp: true,
      googleId: true,
      emailVerified: true,
      timezone: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          workouts: true,
          bodyWeights: true,
          goals: true,
          personalRecords: true,
          exercises: true,
        },
      },
    },
  });
  if (!user) throw httpError(404, 'User not found');

  // thống kê workout gần đây
  const recentWorkouts = await prisma.workout.findMany({
    where: { userId: id },
    orderBy: { date: 'desc' },
    take: 10,
    include: {
      exercises: { include: { sets: true } },
    },
  });

  const recentStats = recentWorkouts.map((w) => {
    const sets = w.exercises.reduce((s, we) => s + we.sets.length, 0);
    const vol = w.exercises.reduce(
      (s, we) => s + we.sets.reduce((a, x) => a + volume(x.weight, x.reps), 0),
      0
    );
    return {
      id: w.id,
      name: w.name,
      date: w.date,
      duration: w.duration,
      sets,
      volume: vol,
    };
  });

  res.json({ user, recentWorkouts: recentStats });
}

export async function banUser(req, res) {
  const { id } = req.params;
  const { reason } = req.body || {};

  if (id === req.admin.id) throw httpError(400, 'Cannot ban yourself');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw httpError(404, 'User not found');
  if (target.role === 'admin') throw httpError(400, 'Cannot ban another admin');

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isBanned: true,
      bannedAt: new Date(),
      bannedReason: reason || null,
    },
    select: { id: true, email: true, isBanned: true, bannedAt: true },
  });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'user.ban',
    targetType: 'User',
    targetId: id,
    meta: { reason: reason || null, email: target.email },
  });

  res.json({ user: updated });
}

export async function unbanUser(req, res) {
  const { id } = req.params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw httpError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { isBanned: false, bannedAt: null, bannedReason: null },
    select: { id: true, email: true, isBanned: true },
  });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'user.unban',
    targetType: 'User',
    targetId: id,
    meta: { email: target.email },
  });

  res.json({ user: updated });
}

export async function setRole(req, res) {
  const { id } = req.params;
  const { role } = req.body || {};
  if (!['user', 'admin'].includes(role)) throw httpError(400, 'Invalid role');
  if (id === req.admin.id && role !== 'admin')
    throw httpError(400, 'Cannot demote yourself');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw httpError(404, 'User not found');

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'user.setRole',
    targetType: 'User',
    targetId: id,
    meta: { from: target.role, to: role, email: target.email },
  });

  res.json({ user: updated });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (id === req.admin.id) throw httpError(400, 'Cannot delete yourself');

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw httpError(404, 'User not found');
  if (target.role === 'admin') throw httpError(400, 'Cannot delete another admin');

  await writeAudit({
    req,
    actor: req.admin,
    action: 'user.delete',
    targetType: 'User',
    targetId: id,
    meta: { email: target.email, name: target.name },
  });

  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
}

// ============================================================
// IP BLOCKS
// ============================================================

export async function listBlocks(req, res) {
  const blocks = await prisma.ipBlock.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  res.json({ blocks });
}

export async function createBlock(req, res) {
  const { ip, reason, expiresAt } = req.body || {};
  if (!ip) throw httpError(400, 'ip required');

  // validate đơn giản (IPv4/IPv6)
  if (!/^[0-9a-fA-F:.]{3,45}$/.test(ip)) throw httpError(400, 'Invalid IP');

  const existing = await prisma.ipBlock.findUnique({ where: { ip } });
  if (existing) throw httpError(409, 'IP already blocked');

  const block = await prisma.ipBlock.create({
    data: {
      ip,
      reason: reason || null,
      createdBy: req.admin.email,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'ip.block',
    targetType: 'IpBlock',
    targetId: block.id,
    meta: { ip, reason: reason || null, expiresAt: expiresAt || null },
  });

  res.status(201).json({ block });
}

export async function deleteBlock(req, res) {
  const { id } = req.params;
  const block = await prisma.ipBlock.findUnique({ where: { id } });
  if (!block) throw httpError(404, 'Block not found');

  await prisma.ipBlock.delete({ where: { id } });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'ip.unblock',
    targetType: 'IpBlock',
    targetId: id,
    meta: { ip: block.ip },
  });

  res.json({ ok: true });
}

export async function blockUserLastIp(req, res) {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { email: true, lastLoginIp: true },
  });
  if (!user) throw httpError(404, 'User not found');
  if (!user.lastLoginIp) throw httpError(400, 'User has no recorded IP');

  const existing = await prisma.ipBlock.findUnique({
    where: { ip: user.lastLoginIp },
  });
  if (existing) return res.json({ block: existing, alreadyBlocked: true });

  const block = await prisma.ipBlock.create({
    data: {
      ip: user.lastLoginIp,
      reason: `Blocked via user ${user.email}`,
      createdBy: req.admin.email,
    },
  });

  await writeAudit({
    req,
    actor: req.admin,
    action: 'ip.block',
    targetType: 'IpBlock',
    targetId: block.id,
    meta: { ip: user.lastLoginIp, fromUser: user.email },
  });

  res.status(201).json({ block });
}

// ============================================================
// AUDIT LOG
// ============================================================

export async function listAudit(req, res) {
  const { limit = '100', offset = '0', action } = req.query;
  const take = Math.min(500, Math.max(1, Number(limit) || 100));
  const skip = Math.max(0, Number(offset) || 0);

  const where = {};
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ logs, total });
}