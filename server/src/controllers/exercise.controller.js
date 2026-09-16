import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM } from '../utils/calc.js';

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
        best.max_weight = {
          type: 'max_weight',
          value: s.weight,
          reps: s.reps,
          weight: s.weight,
          achievedAt: at,
        };
      if (!best.max_reps || s.reps > best.max_reps.value)
        best.max_reps = {
          type: 'max_reps',
          value: s.reps,
          reps: s.reps,
          weight: s.weight,
          achievedAt: at,
        };
      const v = s.weight * s.reps;
      if (!best.max_volume || v > best.max_volume.value)
        best.max_volume = {
          type: 'max_volume',
          value: v,
          reps: s.reps,
          weight: s.weight,
          achievedAt: at,
        };
      const est = s.estimated1RM ?? epley1RM(s.weight, s.reps);
      if (est != null && s.reps > 0 && s.reps <= 20) {
        if (!best.estimated_1rm || est > best.estimated_1rm.value)
          best.estimated_1rm = {
            type: 'estimated_1rm',
            value: est,
            reps: s.reps,
            weight: s.weight,
            achievedAt: at,
          };
      }
    }
  }
  return Object.values(best)
    .filter(Boolean)
    .sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));
}

export async function listExercises(req, res) {
  const userId = req.user.id;
  const { q, muscleGroup, limit, offset } = req.query;
  const where = {
    AND: [
      { OR: [{ userId: null }, { userId }] },
      q ? { name: { contains: q } } : {},
      muscleGroup ? { muscleGroup } : {},
    ],
  };
  const take = limit ? Math.min(200, Number(limit)) : 100;
  const skip = offset ? Number(offset) : 0;

  const [exercises, total] = await Promise.all([
    prisma.exercise.findMany({
      where,
      orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
      take,
      skip,
      select: {
        id: true,
        name: true,
        muscleGroup: true,
        equipment: true,
        isCustom: true,
        videoUrl: true,
        imageUrl: true,
      },
    }),
    prisma.exercise.count({ where }),
  ]);

  res.json({ exercises, total });
}

export async function createExercise(req, res) {
  const { name, muscleGroup, equipment } = req.body;
  if (!name || !muscleGroup) throw httpError(400, 'name and muscleGroup required');
  try {
    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscleGroup,
        equipment,
        isCustom: true,
        userId: req.user.id,
      },
    });
    res.status(201).json({ exercise });
  } catch {
    throw httpError(409, 'Exercise already exists');
  }
}

export async function getExercise(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  const exercise = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
  });
  if (!exercise) throw httpError(404, 'Exercise not found');

  const sets = await prisma.workoutSet.findMany({
    where: {
      workoutExercise: {
        exerciseId: id,
        workout: { userId },
      },
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
      id: s.id,
      setNumber: s.setNumber,
      weight: s.weight,
      reps: s.reps,
      rir: s.rir,
      rpe: s.rpe,
      estimated1RM: s.estimated1RM,
    });
  }
  const sessionList = [...sessions.values()].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let totalSets = 0,
    totalReps = 0,
    totalVolume = 0,
    maxWeight = 0,
    best1RM = 0,
    best5 = 0,
    best10 = 0,
    startingWeight = null,
    currentBest = 0;

  for (const sess of sessionList) {
    for (const s of sess.sets) {
      totalSets++;
      totalReps += s.reps;
      totalVolume += volume(s.weight, s.reps);
      if (startingWeight == null) startingWeight = s.weight;
      if (s.weight > maxWeight) maxWeight = s.weight;
      if (s.estimated1RM && s.estimated1RM > best1RM) best1RM = s.estimated1RM;
      if (s.reps >= 5 && s.weight > best5) best5 = s.weight;
      if (s.reps >= 10 && s.weight > best10) best10 = s.weight;
    }
    if (sess.sets.length) {
      currentBest = Math.max(currentBest, ...sess.sets.map((s) => s.weight));
    }
  }

  const prs = computeBestForExercise(sessionList);

  res.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      isCustom: exercise.isCustom,
      videoUrl: exercise.videoUrl,
      imageUrl: exercise.imageUrl,
      imageUrls: exercise.imageUrls,
      bodyParts: exercise.bodyParts,
      targetMuscles: exercise.targetMuscles,
      secondaryMuscles: exercise.secondaryMuscles,
      equipments: exercise.equipments,
      exerciseType: exercise.exerciseType,
      overview: exercise.overview,
      instructions: exercise.instructions,
      exerciseTips: exercise.exerciseTips,
      variations: exercise.variations,
      keywords: exercise.keywords,
    },
    stats: {
      totalSets,
      totalReps,
      totalSessions: sessionList.length,
      totalVolume,
      maxWeight,
      best1RM,
      best5,
      best10,
      startingWeight: startingWeight ?? 0,
      currentBest,
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