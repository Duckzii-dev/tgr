import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { epley1RM } from '../utils/calc.js';
import {
  findStandards,
  levelFromRatio,
  nextLevelInfo,
  levelLabel,
  LEVELS,
} from '../services/strength.service.js';

const DEFAULT_BODYWEIGHT = 70;

/**
 * GET /api/strength/level/:exerciseId
 * Trả về strength level cho 1 exercise.
 */
export async function getExerciseLevel(req, res) {
  const userId = req.user.id;
  const { exerciseId } = req.params;
  const gender = req.query.gender === 'female' ? 'female' : 'male';

  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, OR: [{ userId: null }, { userId }] },
  });
  if (!exercise) throw httpError(404, 'Exercise not found');

  // Bodyweight mới nhất
  const latestBw = await prisma.bodyWeight.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });
  const bodyweight = latestBw?.weight ?? DEFAULT_BODYWEIGHT;
  const assumedBodyweight = !latestBw;

  // Best 1RM từ PersonalRecord
  const bestPr = await prisma.personalRecord.findFirst({
    where: { userId, exerciseId, type: 'estimated_1rm' },
    orderBy: { value: 'desc' },
  });

  let best1RM = bestPr?.value ?? null;
  let best1RMSource = bestPr ? 'personal_record' : null;

  // Fallback: tính từ WorkoutSet
  if (best1RM == null) {
    const sets = await prisma.workoutSet.findMany({
      where: {
        workoutExercise: { exerciseId, workout: { userId } },
      },
      select: { weight: true, reps: true, estimated1RM: true },
    });
    for (const s of sets) {
      const est = s.estimated1RM ?? epley1RM(s.weight, s.reps);
      if (est != null && (best1RM == null || est > best1RM)) {
        best1RM = est;
        best1RMSource = 'computed';
      }
    }
  }

  if (best1RM == null) {
    return res.json({
      exercise: { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup },
      bodyweight,
      assumedBodyweight,
      best1RM: null,
      ratio: null,
      level: 'untrained',
      levelLabel: levelLabel('untrained'),
      nextLevel: null,
      allLevels: null,
      hasStandards: false,
      gender,
    });
  }

  const standards = await findStandards(exercise.name);

  if (!standards) {
    return res.json({
      exercise: { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup },
      bodyweight,
      assumedBodyweight,
      best1RM,
      ratio: +(best1RM / bodyweight).toFixed(3),
      level: null,
      levelLabel: '—',
      nextLevel: null,
      allLevels: null,
      hasStandards: false,
      gender,
      source: best1RMSource,
    });
  }

  const genderStandards = standards[gender];
  const ratio = best1RM / bodyweight;
  const level = levelFromRatio(ratio, genderStandards);
  const next = nextLevelInfo(level, genderStandards, bodyweight);

  // All levels + target 1RM
  const allLevels = LEVELS.map((lvl) => ({
    level: lvl,
    label: levelLabel(lvl),
    ratio: genderStandards[lvl],
    target1RM: +(genderStandards[lvl] * bodyweight).toFixed(1),
    achieved: ratio >= genderStandards[lvl],
  }));

  res.json({
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
    },
    bodyweight,
    assumedBodyweight,
    best1RM: +best1RM.toFixed(1),
    ratio: +ratio.toFixed(3),
    level,
    levelLabel: levelLabel(level),
    nextLevel: next,
    allLevels,
    hasStandards: true,
    gender,
    source: best1RMSource,
  });
}

/**
 * GET /api/strength/levels
 * Trả về level cho tất cả exercise user đã tập.
 */
export async function listAllLevels(req, res) {
  const userId = req.user.id;
  const gender = req.query.gender === 'female' ? 'female' : 'male';

  const latestBw = await prisma.bodyWeight.findFirst({
    where: { userId },
    orderBy: { recordedAt: 'desc' },
  });
  const bodyweight = latestBw?.weight ?? DEFAULT_BODYWEIGHT;
  const assumedBodyweight = !latestBw;

  // Lấy tất cả PR estimated_1rm
  const prs = await prisma.personalRecord.findMany({
    where: { userId, type: 'estimated_1rm' },
    include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
    orderBy: { value: 'desc' },
  });

  const results = [];
  for (const pr of prs) {
    const standards = await findStandards(pr.exercise.name);
    if (!standards) {
      results.push({
        exercise: pr.exercise,
        best1RM: pr.value,
        ratio: +(pr.value / bodyweight).toFixed(3),
        level: null,
        levelLabel: '—',
        hasStandards: false,
      });
      continue;
    }
    const genderStandards = standards[gender];
    const ratio = pr.value / bodyweight;
    const level = levelFromRatio(ratio, genderStandards);
    const next = nextLevelInfo(level, genderStandards, bodyweight);
    results.push({
      exercise: pr.exercise,
      best1RM: +pr.value.toFixed(1),
      ratio: +ratio.toFixed(3),
      level,
      levelLabel: levelLabel(level),
      nextLevel: next,
      hasStandards: true,
    });
  }

  res.json({
    bodyweight,
    assumedBodyweight,
    gender,
    levels: results,
  });
}