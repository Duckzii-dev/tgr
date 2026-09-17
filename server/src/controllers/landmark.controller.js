import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import {
  MUSCLE_GROUPS,
  defaultFor,
  analyzeStatus,
} from '../services/landmark.service.js';

/**
 * GET /api/landmarks
 * Trả về landmarks (có override hoặc default) + số set 7 ngày qua mỗi muscle group.
 */
export async function listLandmarks(req, res) {
  const userId = req.user.id;

  // Fetch overrides
  const overrides = await prisma.muscleLandmark.findMany({
    where: { userId },
  });
  const byGroup = {};
  for (const o of overrides) byGroup[o.muscleGroup] = o;

  // Compute sets in last 7 days per muscle group
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const sets = await prisma.workoutSet.findMany({
    where: {
      isWarmup: false,
      workoutExercise: {
        workout: { userId, date: { gte: since } },
      },
    },
    include: {
      workoutExercise: {
        include: {
          exercise: { select: { muscleGroup: true } },
        },
      },
    },
  });

  const sets7d = {};
  for (const g of MUSCLE_GROUPS) sets7d[g] = 0;
  for (const s of sets) {
    const mg = s.workoutExercise.exercise.muscleGroup;
    if (!(mg in sets7d)) sets7d[mg] = 0;
    sets7d[mg] += 1;
  }

  const results = MUSCLE_GROUPS.map((g) => {
    const override = byGroup[g];
    const def = defaultFor(g);
    const landmark = {
      muscleGroup: g,
      mev: override?.mev ?? def.mev,
      mav: override?.mav ?? def.mav,
      mrv: override?.mrv ?? def.mrv,
      isCustom: !!override,
      currentSets: sets7d[g] || 0,
    };
    landmark.status = analyzeStatus(landmark.currentSets, landmark);
    return landmark;
  });

  res.json({ landmarks: results });
}

/**
 * PUT /api/landmarks/:muscleGroup
 * body: { mev?, mav?, mrv? }
 */
export async function upsertLandmark(req, res) {
  const userId = req.user.id;
  const { muscleGroup } = req.params;
  if (!MUSCLE_GROUPS.includes(muscleGroup)) {
    throw httpError(400, 'Invalid muscle group');
  }

  const { mev, mav, mrv } = req.body || {};
  const def = defaultFor(muscleGroup);

  const mevVal = mev != null ? Number(mev) : null;
  const mavVal = mav != null ? Number(mav) : null;
  const mrvVal = mrv != null ? Number(mrv) : null;

  const landmark = await prisma.muscleLandmark.upsert({
    where: {
      userId_muscleGroup: { userId, muscleGroup },
    },
    create: {
      userId,
      muscleGroup,
      mev: mevVal ?? def.mev,
      mav: mavVal ?? def.mav,
      mrv: mrvVal ?? def.mrv,
    },
    update: {
      ...(mevVal != null ? { mev: mevVal } : {}),
      ...(mavVal != null ? { mav: mavVal } : {}),
      ...(mrvVal != null ? { mrv: mrvVal } : {}),
    },
  });

  res.json({ landmark });
}

/**
 * DELETE /api/landmarks/:muscleGroup
 * Reset về default.
 */
export async function resetLandmark(req, res) {
  const userId = req.user.id;
  const { muscleGroup } = req.params;

  await prisma.muscleLandmark.deleteMany({
    where: { userId, muscleGroup },
  });

  res.json({ ok: true });
}
