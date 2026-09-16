import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM, durationSeconds } from '../utils/calc.js';
import { evaluatePRs } from '../services/pr.service.js';

export async function listWorkouts(req, res) {
  const userId = req.user.id;
  const { from, to, q, exerciseId, minDuration, minVolume, hasPR } = req.query;
  const where = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (q) where.name = { contains: q };
  if (exerciseId) where.exercises = { some: { exerciseId } };

  const workouts = await prisma.workout.findMany({
    where,
    include: { exercises: { include: { exercise: true, sets: true } } },
    orderBy: { date: 'desc' },
  });

  let filtered = workouts;
  if (minDuration)
    filtered = filtered.filter((w) => (w.duration || 0) >= Number(minDuration) * 60);
  if (minVolume) {
    filtered = filtered.filter((w) => {
      const v = w.exercises.reduce(
        (sum, we) => sum + we.sets.reduce((s, x) => s + volume(x.weight, x.reps), 0),
        0
      );
      return v >= Number(minVolume);
    });
  }
  if (hasPR === 'true') {
    const prs = await prisma.personalRecord.findMany({
      where: { userId },
      select: { achievedAt: true },
    });
    const dates = new Set(
      prs.map((p) => new Date(p.achievedAt).toISOString().slice(0, 10))
    );
    filtered = filtered.filter((w) =>
      dates.has(new Date(w.date).toISOString().slice(0, 10))
    );
  }

  const result = filtered.map((w) => {
    const stats = w.exercises.reduce(
      (acc, we) => {
        for (const s of we.sets) {
          acc.sets++;
          acc.reps += s.reps;
          acc.volume += volume(s.weight, s.reps);
        }
        return acc;
      },
      { sets: 0, reps: 0, volume: 0 }
    );
    return {
      id: w.id,
      name: w.name,
      date: w.date,
      workoutType: w.workoutType,
      duration: w.duration,
      ...stats,
    };
  });

  res.json({ workouts: result });
}

export async function createWorkout(req, res) {
  const userId = req.user.id;
  const { name, date, workoutType, notes, duration } = req.body;
  if (!name) throw httpError(400, 'name required');
  const workout = await prisma.workout.create({
    data: {
      userId,
      name,
      date: date ? new Date(date) : new Date(),
      workoutType: workoutType || 'strength',
      notes: notes || null,
      duration: duration != null ? Number(duration) : null,
    },
  });
  res.status(201).json({ workout });
}

export async function getWorkout(req, res) {
  const { id } = req.params;
  const workout = await prisma.workout.findFirst({
    where: { id, userId: req.user.id },
    include: {
      exercises: {
        include: { exercise: true, sets: { orderBy: { setNumber: 'asc' } } },
        orderBy: { order: 'asc' },
      },
    },
  });
  if (!workout) throw httpError(404, 'Workout not found');
  res.json({ workout });
}

export async function updateWorkout(req, res) {
  const { id } = req.params;
  const { name, notes, workoutType, startTime, endTime, date, duration } = req.body;
  const workout = await prisma.workout.findFirst({ where: { id, userId: req.user.id } });
  if (!workout) throw httpError(404, 'Workout not found');

  let finalDuration = duration != null ? Number(duration) : workout.duration;
  if (startTime && endTime) finalDuration = durationSeconds(startTime, endTime);

  const updated = await prisma.workout.update({
    where: { id },
    data: {
      name: name ?? workout.name,
      notes: notes ?? workout.notes,
      workoutType: workoutType ?? workout.workoutType,
      date: date ? new Date(date) : workout.date,
      startTime: startTime ? new Date(startTime) : workout.startTime,
      endTime: endTime ? new Date(endTime) : workout.endTime,
      duration: finalDuration,
    },
  });
  res.json({ workout: updated });
}

export async function deleteWorkout(req, res) {
  const { id } = req.params;
  const workout = await prisma.workout.findFirst({ where: { id, userId: req.user.id } });
  if (!workout) throw httpError(404, 'Workout not found');
  await prisma.workout.delete({ where: { id } });
  res.json({ ok: true });
}

export async function finishWorkout(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const workout = await prisma.workout.findFirst({
    where: { id, userId },
    include: { exercises: { include: { exercise: true, sets: true } } },
  });
  if (!workout) throw httpError(404, 'Workout not found');

  const isBackfill = workout.startTime === null && workout.duration !== null;
  const endTime = new Date();
  let duration = workout.duration;

  if (!isBackfill && !workout.startTime) {
    const startTime = workout.createdAt;
    duration = durationSeconds(startTime, endTime);
    await prisma.workout.update({
      where: { id },
      data: { endTime, startTime, duration },
    });
  } else if (!isBackfill && workout.startTime && !workout.endTime) {
    duration = durationSeconds(workout.startTime, endTime);
    await prisma.workout.update({
      where: { id },
      data: { endTime, duration },
    });
  }

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  const prsDetected = [];

  for (const we of workout.exercises) {
    for (const s of we.sets) {
      totalSets++;
      totalReps += s.reps;
      totalVolume += volume(s.weight, s.reps);
      const created = await evaluatePRs({
        userId,
        exerciseId: we.exerciseId,
        weight: s.weight,
        reps: s.reps,
        achievedAt: endTime,
        workoutId: id,
      });
      prsDetected.push(
        ...created.map((p) => ({
          exercise: we.exercise.name,
          type: p.type,
          value: p.value,
        }))
      );
    }
  }

  const updated = await prisma.workout.findUnique({ where: { id } });

  res.json({
    workout: updated,
    summary: {
      duration: updated.duration,
      exercises: workout.exercises.length,
      sets: totalSets,
      reps: totalReps,
      volume: totalVolume,
      prs: prsDetected,
    },
  });
}

export async function addExercise(req, res) {
  const { id } = req.params;
  const { exerciseId } = req.body;
  const workout = await prisma.workout.findFirst({ where: { id, userId: req.user.id } });
  if (!workout) throw httpError(404, 'Workout not found');
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, OR: [{ userId: null }, { userId: req.user.id }] },
  });
  if (!exercise) throw httpError(404, 'Exercise not found');
  const count = await prisma.workoutExercise.count({ where: { workoutId: id } });
  const we = await prisma.workoutExercise.create({
    data: { workoutId: id, exerciseId, order: count },
    include: { exercise: true, sets: true },
  });
  res.status(201).json({ workoutExercise: we });
}

export async function removeExercise(req, res) {
  const { id, weId } = req.params;
  const we = await prisma.workoutExercise.findFirst({
    where: { id: weId, workoutId: id, workout: { userId: req.user.id } },
  });
  if (!we) throw httpError(404, 'Not found');
  await prisma.workoutExercise.delete({ where: { id: weId } });
  res.json({ ok: true });
}

export async function reorderExercises(req, res) {
  const userId = req.user.id;
  const { id } = req.params;
  const { order } = req.body;
  if (!Array.isArray(order)) throw httpError(400, 'order must be an array');

  const workout = await prisma.workout.findFirst({ where: { id, userId } });
  if (!workout) throw httpError(404, 'Workout not found');

  await prisma.$transaction(
    order.map((o) =>
      prisma.workoutExercise.update({
        where: { id: o.id },
        data: { order: Number(o.order) },
      })
    )
  );

  res.json({ ok: true });
}

export async function reorderSets(req, res) {
  const userId = req.user.id;
  const { weId } = req.params;
  const { order } = req.body;
  if (!Array.isArray(order)) throw httpError(400, 'order must be an array');

  const we = await prisma.workoutExercise.findFirst({
    where: { id: weId, workout: { userId } },
  });
  if (!we) throw httpError(404, 'Workout exercise not found');

  await prisma.$transaction(
    order.map((o) =>
      prisma.workoutSet.update({
        where: { id: o.id },
        data: { setNumber: Number(o.setNumber) },
      })
    )
  );

  res.json({ ok: true });
}

export async function previousSession(req, res) {
  const { exerciseId } = req.params;
  const { before } = req.query;
  const we = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId,
      workout: {
        userId: req.user.id,
        date: { lt: before ? new Date(before) : new Date() },
      },
    },
    include: { sets: { orderBy: { setNumber: 'asc' } }, workout: true },
    orderBy: { workout: { date: 'desc' } },
  });
  res.json({
    previous: we
      ? { workoutId: we.workoutId, date: we.workout.date, sets: we.sets }
      : null,
  });
}

export async function addSet(req, res) {
  const { weId } = req.params;
  const { weight, reps, rir, rpe, restSeconds, isWarmup } = req.body;
  const we = await prisma.workoutExercise.findFirst({
    where: { id: weId, workout: { userId: req.user.id } },
  });
  if (!we) throw httpError(404, 'Workout exercise not found');
  const count = await prisma.workoutSet.count({
    where: { workoutExerciseId: weId },
  });
  const set = await prisma.workoutSet.create({
    data: {
      workoutExerciseId: weId,
      setNumber: count + 1,
      weight: Number(weight),
      reps: Number(reps),
      rir: rir != null ? Number(rir) : null,
      rpe: rpe != null ? Number(rpe) : null,
      restSeconds: restSeconds != null ? Number(restSeconds) : null,
      estimated1RM: epley1RM(weight, reps),
      isWarmup: !!isWarmup,
    },
  });
  res.status(201).json({ set });
}

export async function updateSet(req, res) {
  const { setId } = req.params;
  const { weight, reps, rir, rpe, restSeconds, isWarmup } = req.body;
  const ex = await prisma.workoutSet.findFirst({
    where: { id: setId, workoutExercise: { workout: { userId: req.user.id } } },
  });
  if (!ex) throw httpError(404, 'Set not found');
  const w = weight != null ? Number(weight) : ex.weight;
  const r = reps != null ? Number(reps) : ex.reps;
  const set = await prisma.workoutSet.update({
    where: { id: setId },
    data: {
      weight: w,
      reps: r,
      rir: rir != null ? Number(rir) : ex.rir,
      rpe: rpe != null ? Number(rpe) : ex.rpe,
      restSeconds: restSeconds != null ? Number(restSeconds) : ex.restSeconds,
      isWarmup: isWarmup != null ? !!isWarmup : ex.isWarmup,
      estimated1RM: epley1RM(w, r),
    },
  });
  res.json({ set });
}

export async function deleteSet(req, res) {
  const { setId } = req.params;
  const ex = await prisma.workoutSet.findFirst({
    where: { id: setId, workoutExercise: { workout: { userId: req.user.id } } },
  });
  if (!ex) throw httpError(404, 'Set not found');
  await prisma.workoutSet.delete({ where: { id: setId } });
  res.json({ ok: true });
}

export async function duplicatePrevious(req, res) {
  const { weId } = req.params;
  const current = await prisma.workoutExercise.findFirst({
    where: { id: weId, workout: { userId: req.user.id } },
    include: { workout: true },
  });
  if (!current) throw httpError(404, 'Not found');
  const prev = await prisma.workoutExercise.findFirst({
    where: {
      exerciseId: current.exerciseId,
      workout: { userId: req.user.id, date: { lt: current.workout.date } },
    },
    include: { sets: { orderBy: { setNumber: 'asc' } } },
    orderBy: { workout: { date: 'desc' } },
  });
  if (!prev || prev.sets.length === 0) return res.json({ created: 0 });
  const existingCount = await prisma.workoutSet.count({
    where: { workoutExerciseId: weId },
  });
  const data = prev.sets.map((s, i) => ({
    workoutExerciseId: weId,
    setNumber: existingCount + i + 1,
    weight: s.weight,
    reps: s.reps,
    rir: s.rir,
    rpe: s.rpe,
    restSeconds: s.restSeconds,
    estimated1RM: s.estimated1RM,
  }));
  await prisma.workoutSet.createMany({ data });
  res.json({ created: data.length });
}

export async function bulkDeleteWorkouts(req, res) {
  const userId = req.user.id;
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) throw httpError(400, 'ids required');

  const workouts = await prisma.workout.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  const allowed = workouts.map((w) => w.id);
  if (allowed.length === 0) throw httpError(404, 'No matching workouts');

  await prisma.workout.deleteMany({ where: { id: { in: allowed } } });
  res.json({ deleted: allowed.length });
}