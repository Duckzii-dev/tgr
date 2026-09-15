import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { epley1RM } from '../utils/calc.js';

function computeBestForExercise(sessions) {
  const best = {
    max_weight: null,
    max_reps: null,
    estimated_1rm: null,
    max_volume: null,
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
export async function listBodyWeight(req, res) {
  const { from, to } = req.query;
  const where = { userId: req.user.id };
  if (from || to) {
    where.recordedAt = {};
    if (from) where.recordedAt.gte = new Date(from);
    if (to) where.recordedAt.lte = new Date(to);
  }
  const records = await prisma.bodyWeight.findMany({
    where,
    orderBy: { recordedAt: 'asc' },
  });
  res.json({ records });
}

export async function createBodyWeight(req, res) {
  const { weight, recordedAt, notes } = req.body;
  if (!weight) throw httpError(400, 'weight required');
  const record = await prisma.bodyWeight.create({
    data: {
      userId: req.user.id,
      weight: Number(weight),
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      notes,
    },
  });
  res.status(201).json({ record });
}

export async function updateBodyWeight(req, res) {
  const { id } = req.params;
  const ex = await prisma.bodyWeight.findFirst({ where: { id, userId: req.user.id } });
  if (!ex) throw httpError(404, 'Not found');
  const { weight, recordedAt, notes } = req.body;
  const record = await prisma.bodyWeight.update({
    where: { id },
    data: {
      weight: weight != null ? Number(weight) : ex.weight,
      recordedAt: recordedAt ? new Date(recordedAt) : ex.recordedAt,
      notes: notes ?? ex.notes,
    },
  });
  res.json({ record });
}

export async function deleteBodyWeight(req, res) {
  const { id } = req.params;
  const ex = await prisma.bodyWeight.findFirst({ where: { id, userId: req.user.id } });
  if (!ex) throw httpError(404, 'Not found');
  await prisma.bodyWeight.delete({ where: { id } });
  res.json({ ok: true });
}

export async function bodyWeightStats(req, res) {
  const records = await prisma.bodyWeight.findMany({
    where: { userId: req.user.id },
    orderBy: { recordedAt: 'asc' },
  });
  if (!records.length) {
    return res.json({
      stats: { current: null, starting: null, lowest: null, highest: null, average: null, change: null },
      records: [],
    });
  }
  const w = records.map((r) => r.weight);
  const current = w[w.length - 1];
  const starting = w[0];
  const lowest = Math.min(...w);
  const highest = Math.max(...w);
  const average = w.reduce((a, b) => a + b, 0) / w.length;
  res.json({
    stats: {
      current,
      starting,
      lowest,
      highest,
      average: +average.toFixed(2),
      change: +(current - starting).toFixed(2),
    },
    records,
  });
}