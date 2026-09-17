import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM } from '../utils/calc.js';
import {
  getMuscleContributions,
  labelFor,
} from '../services/muscle.service.js';
import {
  searchUnifiedExercises,
  getUnifiedExercise,
} from '../services/unified-exercise.service.js';

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

/**
 * GET /api/exercises
 * Search hợp nhất: DB + Anatome JSON
 */
export async function listExercises(req, res) {
  const userId = req.user.id;
  const { q, muscleGroup, equipment, difficulty, muscleSlug, source, limit, offset } = req.query;

  const result = await searchUnifiedExercises(userId, {
    q: q || null,
    muscleGroup: muscleGroup || null,
    equipment: equipment || null,
    difficulty: difficulty || null,
    muscleSlug: muscleSlug || null,
    source: source || null,
    limit: limit ? Math.min(200, Number(limit)) : 50,
    offset: offset ? Number(offset) : 0,
  });

  res.json(result);
}

/**
 * GET /api/exercises/facets
 * List facets từ hợp nhất 2 nguồn
 */
export async function facets(req, res) {
  const userId = req.user.id;

  const dbExercises = await prisma.exercise.findMany({
    where: { OR: [{ userId: null }, { userId }] },
    select: { muscleGroup: true, equipment: true },
  });

  const muscleGroups = new Set();
  const equipments = new Set();
  for (const e of dbExercises) {
    if (e.muscleGroup) muscleGroups.add(e.muscleGroup);
    if (e.equipment) equipments.add(e.equipment);
  }

  // Facets từ Anatome
  const { loadAnatomeExercises } = await import('../services/anatome.service.js');
  const { exercises: anatomeExercises } = await loadAnatomeExercises();
  const muscleSlugs = new Set();
  for (const ex of anatomeExercises) {
    for (const m of ex.muscleSlugs || []) muscleSlugs.add(m);
  }

  res.json({
    muscleGroups: [...muscleGroups].sort(),
    equipments: [...equipments].sort(),
    muscleSlugs: [...muscleSlugs].sort(),
  });
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
  const userId = req.user.id;
  const { id } = req.params;

  // Anatome exercise
  if (id.startsWith('anatome:')) {
    const ex = await getUnifiedExercise(userId, id);
    if (!ex) throw httpError(404, 'Exercise not found');
    return res.json({ exercise: ex, stats: null, prs: [], sessions: [] });
  }

  // DB exercise
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
      overview: exercise.overview,
      instructions: exercise.instructions,
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
