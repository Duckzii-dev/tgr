#!/usr/bin/env bash
# ================================================================
# FEATURE 5: WARM-UP CALCULATOR — FULL
# Tạo/sửa tất cả file, không cần sửa thủ công
# Chạy từ root repo: bash feature5-warmup.sh
# ================================================================
set -euo pipefail

ROOT="$(pwd)"
echo "📁 Root: $ROOT"

# ============================================================
# 1. client/src/lib/warmupSettings.js
# ============================================================
mkdir -p client/src/lib
cat > client/src/lib/warmupSettings.js <<'EOF'
const KEY = 'tgr.warmup';

const DEFAULTS = {
  enabled: true,
  sets: [
    { percent: 40, reps: 8, restSeconds: 60 },
    { percent: 55, reps: 5, restSeconds: 60 },
    { percent: 70, reps: 3, restSeconds: 90 },
    { percent: 85, reps: 2, restSeconds: 120 },
  ],
  roundTo: 2.5,
};

export function getWarmupSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS, sets: DEFAULTS.sets.map((s) => ({ ...s })) };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      sets: Array.isArray(parsed.sets) && parsed.sets.length
        ? parsed.sets.map((s) => ({ ...s }))
        : DEFAULTS.sets.map((s) => ({ ...s })),
    };
  } catch {
    return { ...DEFAULTS, sets: DEFAULTS.sets.map((s) => ({ ...s })) };
  }
}

export function setWarmupSettings(patch) {
  const cur = getWarmupSettings();
  const next = { ...cur, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function resetWarmupSettings() {
  localStorage.removeItem(KEY);
  return getWarmupSettings();
}

export function generateWarmupSets(workingWeight, settings) {
  const cfg = settings || getWarmupSettings();
  const round = Number(cfg.roundTo) || 2.5;
  const w = Number(workingWeight);
  if (!w || w <= 0) return [];

  return cfg.sets
    .map((s) => {
      const raw = (w * s.percent) / 100;
      const rounded = Math.round(raw / round) * round;
      return {
        weight: Math.max(round, rounded),
        reps: Math.max(1, Number(s.reps) || 5),
        restSeconds: Number(s.restSeconds) || 60,
        percent: s.percent,
      };
    })
    .filter((s) => s.weight < w)
    .sort((a, b) => a.weight - b.weight);
}
EOF
echo "✅ client/src/lib/warmupSettings.js"

# ============================================================
# 2. client/src/components/WarmupModal.jsx
# ============================================================
mkdir -p client/src/components
cat > client/src/components/WarmupModal.jsx <<'EOF'
import { useEffect, useMemo, useState } from 'react';
import { Flame, RotateCcw, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import Modal from './Modal.jsx';
import {
  getWarmupSettings,
  setWarmupSettings,
  resetWarmupSettings,
  generateWarmupSets,
} from '../lib/warmupSettings.js';

export default function WarmupModal({
  open,
  onClose,
  defaultWorkingWeight = 0,
  onApply,
}) {
  const [workingWeight, setWorkingWeight] = useState('');
  const [settings, setSettings] = useState(getWarmupSettings());
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (open) {
      setWorkingWeight(defaultWorkingWeight ? String(defaultWorkingWeight) : '');
      setSettings(getWarmupSettings());
      setShowConfig(false);
    }
  }, [open, defaultWorkingWeight]);

  const generated = useMemo(() => {
    const w = Number(workingWeight);
    if (!w || w <= 0) return [];
    return generateWarmupSets(w, settings);
  }, [workingWeight, settings]);

  const updateSettings = (patch) => {
    const next = setWarmupSettings(patch);
    setSettings(next);
  };

  const updateSetRow = (idx, patch) => {
    const nextSets = settings.sets.map((s, i) =>
      i === idx ? { ...s, ...patch } : s
    );
    updateSettings({ sets: nextSets });
  };

  const addSetRow = () => {
    const last = settings.sets[settings.sets.length - 1];
    const nextPercent = Math.min(95, (last?.percent ?? 80) + 10);
    updateSettings({
      sets: [...settings.sets, { percent: nextPercent, reps: 2, restSeconds: 90 }],
    });
  };

  const removeSetRow = (idx) => {
    if (settings.sets.length <= 1) return;
    updateSettings({ sets: settings.sets.filter((_, i) => i !== idx) });
  };

  const handleReset = () => {
    const defaults = resetWarmupSettings();
    setSettings(defaults);
  };

  const handleApply = () => {
    if (!generated.length) return;
    onApply(generated);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Warm-up Calculator">
      <div className="space-y-4">
        <div>
          <label className="label">Working weight (kg)</label>
          <input
            autoFocus
            className="input"
            type="number"
            step="0.5"
            placeholder="e.g. 80"
            value={workingWeight}
            onChange={(e) => setWorkingWeight(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-300">
            <Flame className="w-4 h-4 text-accent" /> Warm-up sets
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost text-xs"
              onClick={() => setShowConfig((v) => !v)}
            >
              <SettingsIcon className="w-3 h-3" />
              {showConfig ? 'Hide' : 'Config'}
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={handleReset}
              title="Reset to defaults"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {showConfig && (
          <div className="space-y-2 border border-ink-700 rounded-lg p-3">
            <div className="text-xs text-ink-400 mb-1">
              Cấu hình warm-up (lưu tự động)
            </div>
            {settings.sets.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-1 text-xs text-ink-400">#{i + 1}</div>
                <div className="col-span-3">
                  <input
                    className="input py-1 text-xs"
                    type="number"
                    min="10"
                    max="95"
                    value={s.percent}
                    onChange={(e) =>
                      updateSetRow(i, { percent: Number(e.target.value) || 0 })
                    }
                    title="% of working weight"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    className="input py-1 text-xs"
                    type="number"
                    min="1"
                    value={s.reps}
                    onChange={(e) =>
                      updateSetRow(i, { reps: Number(e.target.value) || 1 })
                    }
                    title="Reps"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    className="input py-1 text-xs"
                    type="number"
                    min="0"
                    value={s.restSeconds}
                    onChange={(e) =>
                      updateSetRow(i, {
                        restSeconds: Number(e.target.value) || 0,
                      })
                    }
                    title="Rest (seconds)"
                  />
                </div>
                <button
                  className="col-span-2 text-ink-400 hover:text-red-400 text-center"
                  onClick={() => removeSetRow(i)}
                  disabled={settings.sets.length <= 1}
                >
                  <Trash2 className="w-3 h-3 mx-auto" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <button className="btn btn-ghost text-xs" onClick={addSetRow}>
                <Plus className="w-3 h-3" /> Add set
              </button>
              <div className="flex-1" />
              <label className="text-xs text-ink-400">
                Round to
                <input
                  className="input py-1 text-xs ml-2 w-16 inline-block"
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={settings.roundTo}
                  onChange={(e) =>
                    updateSettings({ roundTo: Number(e.target.value) || 2.5 })
                  }
                />
                kg
              </label>
            </div>
          </div>
        )}

        {generated.length === 0 ? (
          <div className="text-sm text-ink-400 text-center py-4">
            Nhập working weight để xem warm-up sets
          </div>
        ) : (
          <div className="space-y-1">
            {generated.map((g, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 items-center bg-ink-850 rounded-lg px-3 py-2 text-sm"
              >
                <div className="col-span-1 text-xs text-ink-400">W{i + 1}</div>
                <div className="col-span-3 font-medium">{g.weight}kg</div>
                <div className="col-span-2 text-center text-ink-300">
                  × {g.reps}
                </div>
                <div className="col-span-3 text-xs text-ink-400 text-center">
                  {g.percent}% · rest {g.restSeconds}s
                </div>
                <div className="col-span-3" />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={generated.length === 0}
          >
            <Plus className="w-4 h-4" /> Add {generated.length} warm-up sets
          </button>
        </div>
      </div>
    </Modal>
  );
}
EOF
echo "✅ client/src/components/WarmupModal.jsx"

# ============================================================
# 3. server/src/services/pr.service.js
# ============================================================
mkdir -p server/src/services
cat > server/src/services/pr.service.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { epley1RM, volume } from '../utils/calc.js';

export async function evaluatePRs({
  userId,
  exerciseId,
  weight,
  reps,
  achievedAt,
  excludeWorkoutId,
}) {
  const w = Number(weight);
  const r = Number(reps);
  const est = epley1RM(w, r);
  const vol = volume(w, r);

  const candidates = [
    { type: 'max_weight', value: w, reps: r, weight: w },
    { type: 'max_reps', value: r, reps: r, weight: w },
    { type: 'max_volume', value: vol, reps: r, weight: w },
  ];
  if (est != null && r > 0 && r <= 20) {
    candidates.push({ type: 'estimated_1rm', value: est, reps: r, weight: w });
  }

  const priorSets = await prisma.workoutSet.findMany({
    where: {
      isWarmup: false,
      workoutExercise: {
        exerciseId,
        workout: {
          userId,
          ...(excludeWorkoutId ? { NOT: { id: excludeWorkoutId } } : {}),
        },
      },
    },
    select: { weight: true, reps: true, estimated1RM: true },
  });

  const priorBest = {
    max_weight: 0,
    max_reps: 0,
    max_volume: 0,
    estimated_1rm: 0,
  };
  for (const s of priorSets) {
    if (s.weight > priorBest.max_weight) priorBest.max_weight = s.weight;
    if (s.reps > priorBest.max_reps) priorBest.max_reps = s.reps;
    const v = volume(s.weight, s.reps);
    if (v > priorBest.max_volume) priorBest.max_volume = v;
    const e = s.estimated1RM ?? epley1RM(s.weight, s.reps);
    if (e != null && e > priorBest.estimated_1rm) priorBest.estimated_1rm = e;
  }

  const newPRs = [];
  for (const c of candidates) {
    if (c.value > (priorBest[c.type] || 0)) {
      newPRs.push({
        type: c.type,
        value: c.value,
        reps: c.reps,
        weight: c.weight,
        achievedAt: achievedAt ? new Date(achievedAt) : new Date(),
      });
    }
  }
  return newPRs;
}

export async function persistPRs({ userId, exerciseId, workoutId, prs }) {
  if (!prs.length) return [];
  const created = [];
  for (const p of prs) {
    const row = await prisma.personalRecord.upsert({
      where: {
        userId_exerciseId_type: {
          userId,
          exerciseId,
          type: p.type,
        },
      },
      create: {
        userId,
        exerciseId,
        workoutId: workoutId || null,
        type: p.type,
        value: p.value,
        reps: p.reps ?? null,
        weight: p.weight ?? null,
        achievedAt: p.achievedAt,
      },
      update: {
        value: p.value,
        reps: p.reps ?? null,
        weight: p.weight ?? null,
        achievedAt: p.achievedAt,
        workoutId: workoutId || null,
      },
    });
    created.push(row);
  }
  return created;
}

export async function clearPRsForWorkout(workoutId) {
  await prisma.personalRecord.deleteMany({ where: { workoutId } });
}

export async function rebuildAllPRs(userId) {
  await prisma.personalRecord.deleteMany({ where: { userId } });

  const sets = await prisma.workoutSet.findMany({
    where: { isWarmup: false, workoutExercise: { workout: { userId } } },
    include: {
      workoutExercise: {
        include: {
          workout: { select: { id: true, date: true } },
        },
      },
    },
    orderBy: [
      { workoutExercise: { workout: { date: 'asc' } } },
      { setNumber: 'asc' },
    ],
  });

  const bestByExercise = new Map();

  for (const s of sets) {
    const exId = s.workoutExercise.exerciseId;
    const at = s.workoutExercise.workout.date;
    const workoutId = s.workoutExercise.workout.id;
    const w = s.weight;
    const r = s.reps;
    const est = s.estimated1RM ?? epley1RM(w, r);
    const vol = volume(w, r);

    const candidates = [
      { type: 'max_weight', value: w, reps: r, weight: w },
      { type: 'max_reps', value: r, reps: r, weight: w },
      { type: 'max_volume', value: vol, reps: r, weight: w },
    ];
    if (est != null && r > 0 && r <= 20) {
      candidates.push({ type: 'estimated_1rm', value: est, reps: r, weight: w });
    }

    for (const c of candidates) {
      const key = `${exId}:${c.type}`;
      const cur = bestByExercise.get(key);
      if (!cur || c.value > cur.value) {
        bestByExercise.set(key, { ...c, achievedAt: at, workoutId });
      }
    }
  }

  let count = 0;
  for (const [key, v] of bestByExercise.entries()) {
    const [exerciseId, type] = key.split(':');
    await prisma.personalRecord.create({
      data: {
        userId,
        exerciseId,
        workoutId: v.workoutId,
        type,
        value: v.value,
        reps: v.reps ?? null,
        weight: v.weight ?? null,
        achievedAt: v.achievedAt,
      },
    });
    count++;
  }
  return count;
}
EOF
echo "✅ server/src/services/pr.service.js"

# ============================================================
# 4. server/src/controllers/workout.controller.js
# ============================================================
mkdir -p server/src/controllers
cat > server/src/controllers/workout.controller.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import { volume, epley1RM, durationSeconds } from '../utils/calc.js';
import {
  evaluatePRs,
  persistPRs,
  clearPRsForWorkout,
  rebuildAllPRs,
} from '../services/pr.service.js';

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
      select: { workoutId: true, achievedAt: true },
    });
    const ids = new Set(prs.map((p) => p.workoutId).filter(Boolean));
    const dates = new Set(
      prs.map((p) => new Date(p.achievedAt).toISOString().slice(0, 10))
    );
    filtered = filtered.filter(
      (w) =>
        ids.has(w.id) ||
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
      finishedAt: w.finishedAt,
      ...stats,
    };
  });

  res.json({ workouts: result });
}

export async function createWorkout(req, res) {
  const userId = req.user.id;
  const { name, date, workoutType, notes, duration } = req.body;
  if (!name) throw httpError(400, 'name required');

  const baseDate = date ? new Date(date) : new Date();
  const dur = duration != null ? Number(duration) : null;

  let startTime = null;
  let endTime = null;
  if (dur && dur > 0) {
    const end = new Date(baseDate);
    end.setHours(20, 0, 0, 0);
    endTime = end;
    startTime = new Date(end.getTime() - dur * 1000);
  }

  const workout = await prisma.workout.create({
    data: {
      userId,
      name,
      date: baseDate,
      workoutType: workoutType || 'strength',
      notes: notes || null,
      duration: dur,
      startTime,
      endTime,
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
  await clearPRsForWorkout(id);
  await prisma.workout.delete({ where: { id } });
  await rebuildAllPRs(req.user.id);
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

  if (workout.finishedAt) {
    const summary = await buildSummary(id);
    return res.json({ workout, summary, alreadyFinished: true });
  }

  const endTime = new Date();
  const isBackfill = workout.startTime !== null && workout.duration !== null;

  let duration = workout.duration;
  if (!isBackfill) {
    const startTime = workout.startTime || workout.createdAt;
    duration = durationSeconds(startTime, endTime);
  }

  await prisma.workout.update({
    where: { id },
    data: {
      endTime: workout.endTime || endTime,
      startTime: workout.startTime || workout.createdAt,
      duration,
      finishedAt: endTime,
    },
  });

  for (const we of workout.exercises) {
    for (const s of we.sets) {
      if (s.isWarmup) continue;
      const candidates = await evaluatePRs({
        userId,
        exerciseId: we.exerciseId,
        weight: s.weight,
        reps: s.reps,
        achievedAt: endTime,
        excludeWorkoutId: id,
      });
      if (!candidates.length) continue;
      await persistPRs({
        userId,
        exerciseId: we.exerciseId,
        workoutId: id,
        prs: candidates,
      });
    }
  }

  const updated = await prisma.workout.findUnique({ where: { id } });
  const summary = await buildSummary(id);
  res.json({ workout: updated, summary });
}

async function buildSummary(workoutId) {
  const full = await prisma.workout.findUnique({
    where: { id: workoutId },
    include: { exercises: { include: { exercise: true, sets: true } } },
  });
  if (!full) return null;

  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  for (const we of full.exercises) {
    for (const s of we.sets) {
      if (s.isWarmup) continue;
      totalSets++;
      totalReps += s.reps;
      totalVolume += volume(s.weight, s.reps);
    }
  }

  const prs = await prisma.personalRecord.findMany({
    where: { workoutId },
    include: { exercise: { select: { name: true } } },
  });

  return {
    duration: full.duration,
    exercises: full.exercises.length,
    sets: totalSets,
    reps: totalReps,
    volume: totalVolume,
    prs: prs.map((p) => ({
      exercise: p.exercise.name,
      type: p.type,
      value: p.value,
    })),
  };
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
      rir: rir !== undefined ? (rir === null ? null : Number(rir)) : ex.rir,
      rpe: rpe !== undefined ? (rpe === null ? null : Number(rpe)) : ex.rpe,
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
    isWarmup: s.isWarmup,
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

  await prisma.personalRecord.deleteMany({
    where: { userId, workoutId: { in: allowed } },
  });
  await prisma.workout.deleteMany({ where: { id: { in: allowed } } });
  await rebuildAllPRs(userId);

  res.json({ deleted: allowed.length });
}
EOF
echo "✅ server/src/controllers/workout.controller.js"

# ============================================================
# 5. client/src/pages/WorkoutDetail.jsx
# ============================================================
mkdir -p client/src/pages
cat > client/src/pages/WorkoutDetail.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, Timer, Check, Search, Flame } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Modal from '../components/Modal.jsx';
import Confirm from '../components/Confirm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import WarmupModal from '../components/WarmupModal.jsx';
import Empty from '../components/Empty.jsx';
import { startRestTimer } from '../components/RestTimerHost.jsx';
import { getRestTimerSettings } from '../lib/restTimerSettings.js';
import { fmtDate, fmtDuration, fmtNumber } from '../lib/format.js';

export default function WorkoutDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data, loading, refresh } = useFetch(() => api.get(`/workouts/${id}`), [id]);
  const [addOpen, setAddOpen] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [deleteSet, setDeleteSet] = useState(null);
  const [deleteEx, setDeleteEx] = useState(null);
  const [summary, setSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [warmupFor, setWarmupFor] = useState(null);

  const openAdd = () => {
    setAddOpen(true);
    setSearch('');
    setMuscleFilter('');
  };

  useEffect(() => {
    if (!addOpen) return;
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const p = new URLSearchParams();
        if (search) p.set('q', search);
        if (muscleFilter) p.set('muscleGroup', muscleFilter);
        p.set('limit', '60');
        const res = await api.get(`/exercises?${p}`);
        setExercises(res.exercises || []);
      } catch {}
      finally { setSearchLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [search, muscleFilter, addOpen]);

  const addExercise = async (exerciseId) => {
    try {
      await api.post(`/workouts/${id}/exercises`, { exerciseId });
      setAddOpen(false);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const addSet = async (weId, payload, we) => {
    try {
      await api.post(`/workouts/exercises/${weId}/sets`, payload);
      refresh();

      const settings = getRestTimerSettings();
      if (settings.autoStart && !payload?.isWarmup) {
        const duration = payload?.restSeconds || settings.defaultDuration || 90;
        startRestTimer({
          duration,
          nextExercise: we
            ? {
                name: we.exercise?.name,
                weight: payload?.weight,
                reps: payload?.reps,
              }
            : null,
        });
      }
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const addManySets = async (weId, sets) => {
    try {
      for (const s of sets) {
        await api.post(`/workouts/exercises/${weId}/sets`, {
          ...s,
          isWarmup: true,
        });
      }
      refresh();
      toast(`Added ${sets.length} warm-up sets`);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const updateSet = async (setId, patch) => {
    try {
      await api.put(`/workouts/sets/${setId}`, patch);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const doDeleteSet = async () => {
    try { await api.del(`/workouts/sets/${deleteSet}`); refresh(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const doDeleteEx = async () => {
    try { await api.del(`/workouts/${id}/exercises/${deleteEx}`); refresh(); }
    catch (e) { toast(e.message, 'error'); }
  };

  const dupPrev = async (weId) => {
    try {
      const res = await api.post(`/workouts/exercises/${weId}/duplicate-previous`);
      toast(`Copied ${res.created} sets`);
      refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const finish = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
      const res = await api.post(`/workouts/${id}/finish`);
      setSummary(res.summary);
      refresh();
    } catch (e) { toast(e.message, 'error'); }
    finally { setFinishing(false); }
  };

  const doDelete = async () => {
    try { await api.del(`/workouts/${id}`); nav('/workouts'); }
    catch (e) { toast(e.message, 'error'); }
  };

  if (loading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  if (!data?.workout) return <Empty title="Workout not found" />;
  const w = data.workout;
  const isFinished = !!w.finishedAt;

  const totalVolume = w.exercises.reduce(
    (s, we) =>
      s +
      we.sets.reduce(
        (a, x) => a + (x.isWarmup ? 0 : x.weight * x.reps),
        0
      ),
    0
  );
  const totalSets = w.exercises.reduce(
    (s, we) => s + we.sets.filter((x) => !x.isWarmup).length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{w.name}</h1>
          <div className="text-sm text-ink-400">
            {fmtDate(w.date)} · {fmtDuration(w.duration)} · {totalSets} sets ·{' '}
            {fmtNumber(totalVolume / 1000, 1)}t
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={() => setShowTimer((x) => !x)}>
            <Timer className="w-4 h-4" /> Rest
          </button>
          <button className="btn btn-ghost" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Exercise
          </button>
          <button
            className="btn btn-primary"
            onClick={finish}
            disabled={finishing || isFinished}
            title={isFinished ? 'Workout đã hoàn tất' : 'Finish workout'}
          >
            <Check className="w-4 h-4" />
            {isFinished ? 'Finished' : finishing ? 'Finishing...' : 'Finish'}
          </button>
          <button className="btn btn-ghost" onClick={doDelete}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showTimer && (
        <RestTimer
          onClose={() => setShowTimer(false)}
          initialDuration={90}
          autoStart={false}
        />
      )}

      {w.exercises.length === 0 && (
        <Empty
          title="No exercises yet"
          hint="Add an exercise to start logging sets."
          action={
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus className="w-4 h-4" />Add Exercise
            </button>
          }
        />
      )}

      {w.exercises.map((we) => (
        <ExerciseBlock
          key={we.id}
          we={we}
          onAdd={(weId, payload) => addSet(weId, payload, we)}
          onWarmup={(workingWeight) =>
            setWarmupFor({ weId: we.id, workingWeight })
          }
          onUpdate={updateSet}
          onDelete={(sid) => setDeleteSet(sid)}
          onDup={() => dupPrev(we.id)}
          onRemove={() => setDeleteEx(we.id)}
        />
      ))}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Exercise">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
              <input
                autoFocus
                className="input pl-9"
                placeholder="Tìm bài tập... (vd: bench, squat)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input sm:w-40"
              value={muscleFilter}
              onChange={(e) => setMuscleFilter(e.target.value)}
            >
              <option value="">Tất cả nhóm cơ</option>
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="shoulders">Shoulders</option>
              <option value="biceps">Biceps</option>
              <option value="triceps">Triceps</option>
              <option value="legs">Legs</option>
              <option value="core">Core</option>
              <option value="cardio">Cardio</option>
            </select>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1">
            {searchLoading ? (
              <div className="text-center text-sm text-ink-400 py-6">Đang tìm...</div>
            ) : exercises.length === 0 ? (
              <div className="text-center text-sm text-ink-400 py-6">
                Không tìm thấy bài tập nào
              </div>
            ) : (
              exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-ink-850 flex items-center gap-3"
                >
                  {ex.videoUrl ? (
                    <video
                      src={ex.videoUrl}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="w-12 h-12 rounded object-cover bg-ink-800 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded bg-ink-800 shrink-0 flex items-center justify-center text-[8px] text-ink-500">
                      No img
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm truncate">{ex.name}</div>
                    <div className="text-xs text-ink-400 capitalize truncate">
                      {ex.muscleGroup} · {ex.equipment || '—'}
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-ink-400 shrink-0" />
                </button>
              ))
            )}
          </div>

          <div className="text-xs text-ink-500 text-center">
            {exercises.length} bài tập · gõ để tìm kiếm
          </div>
        </div>
      </Modal>

      <Modal open={!!summary} onClose={() => setSummary(null)} title="Workout Complete">
        {summary && (
          <div className="space-y-2 text-sm">
            <Row label="Duration" value={fmtDuration(summary.duration)} />
            <Row label="Exercises" value={summary.exercises} />
            <Row label="Sets" value={summary.sets} />
            <Row label="Reps" value={summary.reps} />
            <Row label="Volume" value={`${fmtNumber(summary.volume / 1000, 2)}t`} />
            {summary.prs.length > 0 && (
              <div className="pt-2 border-t border-ink-700">
                <div className="text-accent text-xs uppercase mb-1">New PRs</div>
                {summary.prs.map((p, i) => (
                  <div key={i} className="text-sm">
                    {p.exercise} · {p.type.replace('_', ' ')} · {fmtNumber(p.value, 1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <WarmupModal
        open={!!warmupFor}
        onClose={() => setWarmupFor(null)}
        defaultWorkingWeight={warmupFor?.workingWeight || 0}
        onApply={(sets) => addManySets(warmupFor.weId, sets)}
      />

      <Confirm
        open={!!deleteSet}
        onClose={() => setDeleteSet(null)}
        onConfirm={doDeleteSet}
        title="Delete set?"
      />
      <Confirm
        open={!!deleteEx}
        onClose={() => setDeleteEx(null)}
        onConfirm={doDeleteEx}
        title="Remove exercise?"
        body="This will delete all sets for this exercise."
      />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ExerciseBlock({ we, onAdd, onWarmup, onUpdate, onDelete, onDup, onRemove }) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');
  const [rpe, setRpe] = useState('');
  const [prevSets, setPrevSets] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/workouts/previous/${we.exerciseId}`);
        setPrevSets(res.previous?.sets || []);
      } catch {}
    })();
  }, [we.exerciseId]);

  const submit = (e) => {
    e.preventDefault();
    if (!weight || !reps) return;
    onAdd(we.id, {
      weight: Number(weight),
      reps: Number(reps),
      rir: rir ? Number(rir) : null,
      rpe: rpe ? Number(rpe) : null,
      restSeconds: 90,
    });
    setWeight('');
    setReps('');
    setRir('');
    setRpe('');
  };

  const warmupSets = we.sets.filter((s) => s.isWarmup);
  const workingSets = we.sets.filter((s) => !s.isWarmup);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-medium">{we.exercise.name}</div>
          <div className="text-xs text-ink-400 capitalize">
            {we.exercise.muscleGroup} · {we.exercise.equipment || '—'}
          </div>
          {prevSets && prevSets.length > 0 && (
            <div className="text-xs text-ink-400 mt-1">
              Prev: {prevSets.map((s) => `${s.weight}×${s.reps}`).join(', ')}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            className="btn btn-ghost text-xs"
            onClick={() => onWarmup(Number(weight) || 0)}
            title="Generate warm-up sets"
          >
            <Flame className="w-3 h-3" /> Warm-up
          </button>
          <button
            className="btn btn-ghost text-xs"
            onClick={onDup}
            title="Duplicate previous session"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button className="btn btn-ghost text-xs" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {warmupSets.length > 0 && (
        <div className="mb-3 space-y-1 opacity-70">
          <div className="text-[10px] uppercase tracking-wide text-ink-500">
            Warm-up
          </div>
          {warmupSets.map((s, i) => (
            <div
              key={s.id}
              className="grid grid-cols-12 gap-2 items-center bg-ink-900/60 rounded-lg px-2 py-1.5"
            >
              <div className="col-span-1 text-xs text-ink-500">W{i + 1}</div>
              <div className="col-span-2 text-sm text-ink-300">
                {s.weight}kg
              </div>
              <div className="col-span-1 text-center text-ink-500 text-xs">×</div>
              <div className="col-span-2 text-sm text-ink-300">{s.reps}</div>
              <div className="col-span-4 text-xs text-ink-500 text-center">
                {s.restSeconds ? `rest ${s.restSeconds}s` : '—'}
              </div>
              <div className="col-span-2 text-right">
                <button
                  onClick={() => onDelete(s.id)}
                  className="text-ink-500 hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 mb-3">
        {workingSets.map((s, i) => (
          <SetRow
            key={s.id}
            s={s}
            index={i + 1}
            onUpdate={onUpdate}
            onDelete={() => onDelete(s.id)}
          />
        ))}
      </div>

      <form onSubmit={submit} className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-3">
          <label className="label">Weight</label>
          <input
            className="input"
            type="number"
            step="0.5"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Reps</label>
          <input
            className="input"
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="label">RIR</label>
          <input
            className="input"
            type="number"
            min="0"
            max="10"
            placeholder="—"
            value={rir}
            onChange={(e) => setRir(e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="label">RPE</label>
          <input
            className="input"
            type="number"
            min="1"
            max="10"
            step="0.5"
            placeholder="—"
            value={rpe}
            onChange={(e) => setRpe(e.target.value)}
          />
        </div>
        <button className="btn btn-primary col-span-3 justify-center">
          <Plus className="w-4 h-4" /> Add Set
        </button>
      </form>
    </div>
  );
}

function SetRow({ s, index, onUpdate, onDelete }) {
  const [weight, setWeight] = useState(s.weight);
  const [reps, setReps] = useState(s.reps);
  const [rir, setRir] = useState(s.rir ?? '');
  const [rpe, setRpe] = useState(s.rpe ?? '');

  const commit = () => {
    const patch = {};
    if (Number(weight) !== s.weight) patch.weight = Number(weight);
    if (Number(reps) !== s.reps) patch.reps = Number(reps);
    if ((rir === '' ? null : Number(rir)) !== s.rir)
      patch.rir = rir === '' ? null : Number(rir);
    if ((rpe === '' ? null : Number(rpe)) !== s.rpe)
      patch.rpe = rpe === '' ? null : Number(rpe);
    if (Object.keys(patch).length) onUpdate(s.id, patch);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-ink-850 rounded-lg px-2 py-1.5">
      <div className="col-span-1 text-xs text-ink-400">#{index}</div>
      <input
        className="input col-span-2 py-1"
        type="number"
        step="0.5"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
        title="Weight (kg)"
      />
      <div className="col-span-1 text-center text-ink-400 text-xs">×</div>
      <input
        className="input col-span-2 py-1"
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
        title="Reps"
      />
      <input
        className="input col-span-2 py-1"
        type="number"
        min="0"
        max="10"
        placeholder="RIR"
        value={rir}
        onChange={(e) => setRir(e.target.value)}
        onBlur={commit}
        title="Reps in Reserve (0 = failure)"
      />
      <input
        className="input col-span-2 py-1"
        type="number"
        min="1"
        max="10"
        step="0.5"
        placeholder="RPE"
        value={rpe}
        onChange={(e) => setRpe(e.target.value)}
        onBlur={commit}
        title="Rate of Perceived Exertion (10 = max)"
      />
      <div className="col-span-1 text-xs text-ink-400 text-center">
        {s.estimated1RM ? `${s.estimated1RM.toFixed(1)}` : '—'}
      </div>
      <div className="col-span-1 text-right">
        <button onClick={onDelete} className="text-ink-400 hover:text-red-400">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
EOF
echo "✅ client/src/pages/WorkoutDetail.jsx"

echo ""
echo "=============================================="
echo "✅ FEATURE 5 hoàn tất — tất cả file đã ghi"
echo "=============================================="
echo ""
echo "Deploy:"
echo "  git add ."
echo "  git commit -m 'Feature 5: Warm-up Calculator'"
echo "  git push"
echo ""