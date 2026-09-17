import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM } from '../utils/calc.js';
import { getMuscleContributions, labelFor } from '../services/muscle.service.js';
import {
  searchUnifiedExercises,
  getUnifiedExercise,
} from '../services/unified-exercise.service.js';

function computeBestForExercise(sessions) {
  const best = { max_weight: null, max_reps: null, estimated_1rm: null, max_volume: null };
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
  const { q, muscleGroup, muscleSlug, source, limit, offset } = req.query;

  const result = await searchUnifiedExercises(userId, {
    q: q || null,
    muscleGroup: muscleGroup || null,
    muscleSlug: muscleSlug || null,
    source: source || null,
    limit: limit ? Math.min(200, Number(limit)) : 50,
    offset: offset ? Number(offset) : 0,
  });

  res.json(result);
}

export async function facets(req, res) {
  const userId = req.user.id;

  const dbExercises = await prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: { muscleGroup: true, equipment: true, muscleSlugs: true },
  });

  const muscleGroups = new Set();
  const equipments = new Set();
  for (const e of dbExercises) {
    if (e.muscleGroup) muscleGroups.add(e.muscleGroup);
    if (e.equipment) equipments.add(e.equipment);
  }

  const { loadAnatomeExercises } = await import('../services/anatome.service.js');
  const { exercises } = await loadAnatomeExercises();
  const muscleSlugs = new Set();
  const bodyParts = new Set();
  for (const ex of exercises) {
    for (const m of ex.muscleSlugs || []) muscleSlugs.add(m);
    if (ex.bodyPart) bodyParts.add(ex.bodyPart);
  }

  res.json({
    muscleGroups: [...muscleGroups].sort(),
    equipments: [...equipments].sort(),
    muscleSlugs: [...muscleSlugs].sort(),
    bodyParts: [...bodyParts].sort(),
  });
}

export async function createExercise(req, res) {
  const { name, muscleGroup, equipment, muscleSlugs } = req.body;
  if (!name || !muscleGroup) throw httpError(400, 'name and muscleGroup required');

  // Validate muscleSlugs là array string
  const slugs = Array.isArray(muscleSlugs)
    ? muscleSlugs.filter((s) => typeof s === 'string' && s.length > 0)
    : [];

  try {
    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscleGroup,
        equipment: equipment || null,
        muscleSlugs: slugs.length > 0 ? slugs : null,
        isCustom: true,
        userId: req.user.id,
      },
    });
    res.status(201).json({ exercise });
  } catch {
    throw httpError(409, 'Exercise already exists');
  }
}

export async function updateExercise(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { name, muscleGroup, equipment, muscleSlugs } = req.body;

  const existing = await prisma.exercise.findFirst({
    where: { id, userId, isCustom: true },
  });
  if (!existing) throw httpError(404, 'Custom exercise not found');

  const slugs = Array.isArray(muscleSlugs)
    ? muscleSlugs.filter((s) => typeof s === 'string' && s.length > 0)
    : null;

  const updated = await prisma.exercise.update({
    where: { id },
    data: {
      name: name ?? existing.name,
      muscleGroup: muscleGroup ?? existing.muscleGroup,
      equipment: equipment ?? existing.equipment,
      muscleSlugs: slugs !== null ? (slugs.length > 0 ? slugs : null) : existing.muscleSlugs,
    },
  });

  res.json({ exercise: updated });
}

export async function getExercise(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  if (id.startsWith('anatome:')) {
    const ex = await getUnifiedExercise(userId, id);
    if (!ex) throw httpError(404, 'Exercise not found');
    return res.json({ exercise: ex, stats: null, prs: [], sessions: [], muscleContributions: [] });
  }

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
      totalSets++; totalReps += s.reps;
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

  // Custom muscle slugs
  const customSlugs = Array.isArray(exercise.muscleSlugs) ? exercise.muscleSlugs : [];

  res.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      isCustom: exercise.isCustom,
      videoUrl: exercise.videoUrl,
      imageUrl: exercise.imageUrl,
      overview: exercise.overview,
      instructions: exercise.instructions,
      muscleSlugs: customSlugs,
      source: 'db',
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
