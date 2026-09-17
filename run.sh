#!/usr/bin/env bash
# ================================================================
# FEATURE 39: FIX EXERCISES FILTER + SVGs CHO ANATOME
# Chạy từ ~/Code/tgr: bash feature39.sh
# ================================================================
set -euo pipefail

TGR_DIR="$HOME/Code/tgr"
cd "$TGR_DIR"

# ============================================================
# 1. client/src/pages/Exercises.jsx — server-side filter + infinite
# ============================================================
cat > client/src/pages/Exercises.jsx <<'EOF'
import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, X, Play, Activity, Loader, BookOpen } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { useToast } from '../lib/toast.jsx';
import { fmtNumber } from '../lib/format.js';

const PAGE_SIZE = 50;

const SOURCE_TABS = [
  { key: 'all', label: 'All' },
  { key: 'anatome', label: 'Anatome (879)' },
  { key: 'video', label: 'With Video' },
  { key: 'custom', label: 'Custom' },
];

const MUSCLE_FILTERS = [
  '', 'traps', 'lats', 'middle-back', 'lower-back',
  'front-delts', 'side-delts', 'rear-delts',
  'upper-chest', 'chest',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'glutes', 'quadriceps', 'hamstrings', 'calves',
];

function slugify(id) {
  return String(id).replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export default function Exercises() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', muscleGroup: 'chest', equipment: '' });

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);
  const requestIdRef = useRef(0);

  const facets = useFetch(() => api.get('/exercises/facets'), []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Load page — SERVER-SIDE filter
  const loadPage = useCallback(async (reset) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const offset = reset ? 0 : offsetRef.current;
    const p = new URLSearchParams();
    if (debouncedQ) p.set('q', debouncedQ);
    if (muscleSlug) p.set('muscleSlug', muscleSlug);

    // Source mapping
    if (tab === 'anatome') p.set('source', 'anatome');
    else if (tab === 'video') p.set('source', 'video');
    else if (tab === 'custom') p.set('source', 'custom');
    // 'all' = no source param

    p.set('limit', String(PAGE_SIZE));
    p.set('offset', String(offset));

    try {
      const res = await api.get(`/exercises?${p}`);
      if (reqId !== requestIdRef.current) return;

      const list = res.exercises || [];
      const tot = res.total || 0;

      if (reset) {
        setItems(list);
        offsetRef.current = list.length;
      } else {
        setItems((prev) => [...prev, ...list]);
        offsetRef.current = offset + list.length;
      }
      setTotal(tot);
      setHasMore((offset + list.length) < tot);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      setError(e.message);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [debouncedQ, muscleSlug, tab]);

  // Reset + load khi filter đổi
  useEffect(() => {
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
    setError(null);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, muscleSlug, tab]);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadPage(false); },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadPage]);

  const submitCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exercises', form);
      toast('Exercise created');
      setCreateOpen(false);
      setForm({ name: '', muscleGroup: 'chest', equipment: '' });
      setTab('custom');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const onCardClick = (ex) => {
    if (ex.source === 'anatome') {
      navigate(`/exercises/anatome:${ex.svgId || ex.id}`);
    } else {
      navigate(`/exercises/${ex.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-accent" />
          <div>
            <h1 className="text-2xl font-semibold">Exercise Library</h1>
            <p className="text-sm text-ink-400 mt-0.5">
              Hợp nhất: DB + Anatome 879 bài
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Custom
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-700 overflow-x-auto">
        {SOURCE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm whitespace-nowrap ${
              tab === t.key
                ? 'text-accent border-b-2 border-accent'
                : 'text-ink-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Tìm bài tập (bench, squat, curl...)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Muscle filter */}
        <div className="space-y-2 pt-2 border-t border-ink-700">
          <div className="text-[10px] uppercase tracking-wide text-ink-500">
            Muscle
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              className={`chip text-[10px] ${muscleSlug === '' ? 'border-accent text-accent' : ''}`}
              onClick={() => setMuscleSlug('')}
            >
              All
            </button>
            {MUSCLE_FILTERS.filter(Boolean).map((slug) => (
              <button
                key={slug}
                className={`chip text-[10px] capitalize ${muscleSlug === slug ? 'border-accent text-accent' : ''}`}
                onClick={() => setMuscleSlug(muscleSlug === slug ? '' : slug)}
              >
                {slug.replace(/-/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {(muscleSlug || debouncedQ) && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-ink-700">
            <div className="text-ink-400">
              {muscleSlug && <span className="text-accent capitalize">{muscleSlug}</span>}
              {debouncedQ && <span className="ml-2">· "{debouncedQ}"</span>}
              <span className="ml-2">→ {total} kết quả</span>
            </div>
            <button
              className="text-ink-400 hover:text-white flex items-center gap-1"
              onClick={() => { setMuscleSlug(''); setQ(''); }}
            >
              <X className="w-3 h-3" /> Clear
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={() => loadPage(true)}>
            Retry
          </button>
        </div>
      )}

      {items.length === 0 && loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-60" />
          ))}
        </div>
      ) : items.length ? (
        <>
          <div className="text-xs text-ink-400">
            Hiện {items.length} / {total} bài tập
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onCardClick(ex)}
                className="card p-3 space-y-2 text-left hover:border-accent/50 transition-colors group"
              >
                <div className="relative bg-ink-950 rounded-lg h-40 overflow-hidden">
                  {ex.hasSvg ? (
                    <LazySvg exerciseId={ex.svgId || ex.id} className="w-full h-full p-2" />
                  ) : ex.videoUrl ? (
                    <video
                      src={ex.videoUrl}
                      muted loop playsInline preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-500">
                      No media
                    </div>
                  )}
                </div>

                <div className="font-medium text-sm line-clamp-2 min-h-[2.4em] group-hover:text-accent transition-colors">
                  {ex.name}
                </div>

                <div className="flex flex-wrap gap-1">
                  {ex.source && (
                    <span className="chip text-[10px] capitalize">{ex.source}</span>
                  )}
                  {ex.bodyPart && (
                    <span className="chip text-[10px] capitalize">{ex.bodyPart}</span>
                  )}
                  {ex.muscleSlugs?.map((slug) => (
                    <span key={slug} className="chip text-[10px] capitalize border-accent/40">
                      {slug.replace(/-/g, ' ')}
                    </span>
                  ))}
                  {ex.isCustom && (
                    <span className="chip text-[10px] border-accent text-accent">custom</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-6">
              {loading ? (
                <div className="flex items-center gap-2 text-ink-400 text-sm">
                  <Loader className="w-4 h-4 animate-spin" /> Đang tải...
                </div>
              ) : (
                <button className="btn btn-ghost" onClick={() => loadPage(false)}>
                  Load more
                </button>
              )}
            </div>
          )}

          {!hasMore && items.length >= total && total > PAGE_SIZE && (
            <div className="text-center text-xs text-ink-500 py-4">
              Đã hiển thị toàn bộ {total} bài tập
            </div>
          )}
        </>
      ) : !loading ? (
        <Empty
          title="Không có bài tập"
          hint={muscleSlug || debouncedQ ? 'Không có kết quả.' : 'Chưa có dữ liệu.'}
          icon={Search}
        />
      ) : null}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Custom Exercise">
        <form onSubmit={submitCreate} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Muscle Group</label>
            <select className="input" value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}>
              <option value="chest">chest</option>
              <option value="back">back</option>
              <option value="shoulders">shoulders</option>
              <option value="biceps">biceps</option>
              <option value="triceps">triceps</option>
              <option value="legs">legs</option>
              <option value="core">core</option>
              <option value="cardio">cardio</option>
            </select>
          </div>
          <div>
            <label className="label">Equipment</label>
            <input className="input" value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })} />
          </div>
          <button className="btn btn-primary w-full justify-center">Create</button>
        </form>
      </Modal>
    </div>
  );
}
EOF
echo "✅ client/src/pages/Exercises.jsx"

# ============================================================
# 2. server/src/services/unified-exercise.service.js
#    Fix filter muscleSlug cho Anatome
# ============================================================
cat > server/src/services/unified-exercise.service.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { loadAnatomeExercises } from './anatome.service.js';

export async function searchUnifiedExercises(userId, opts = {}) {
  const {
    q,
    muscleGroup,
    muscleSlug,
    source,
    limit = 50,
    offset = 0,
  } = opts;

  // === 1. Fetch DB ===
  const dbWhere = {
    OR: [{ userId: null }, { userId }],
  };
  if (q) dbWhere.name = { contains: q };
  if (muscleGroup) dbWhere.muscleGroup = muscleGroup;
  if (source === 'custom') {
    dbWhere.userId = userId;
    dbWhere.isCustom = true;
  }

  const dbExercises = await prisma.exercise.findMany({
    where: dbWhere,
    select: {
      id: true,
      name: true,
      muscleGroup: true,
      equipment: true,
      isCustom: true,
      videoUrl: true,
      imageUrl: true,
    },
  });

  const dbNames = new Set(dbExercises.map((e) => e.name.toLowerCase()));

  // === 2. Fetch Anatome ===
  const { exercises: anatomeExercises } = await loadAnatomeExercises();

  let anatomeFiltered = anatomeExercises;
  if (q) {
    const ql = q.toLowerCase();
    anatomeFiltered = anatomeFiltered.filter((e) =>
      e.name.toLowerCase().includes(ql) ||
      (e.muscleSlugs || []).some(m => m.toLowerCase().includes(ql))
    );
  }
  if (muscleSlug) {
    anatomeFiltered = anatomeFiltered.filter((e) =>
      (e.muscleSlugs || []).includes(muscleSlug)
    );
  }

  // === 3. Merge ===
  const merged = [];

  const includeDb = source !== 'anatome';
  const includeAnatome = source !== 'db' && source !== 'custom' && source !== 'video';

  if (includeDb) {
    for (const ex of dbExercises) {
      if (source === 'video' && !ex.videoUrl) continue;
      if (muscleSlug && ex.muscleGroup !== muscleSlug) continue;

      merged.push({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        bodyPart: ex.muscleGroup,
        equipment: ex.equipment,
        isCustom: ex.isCustom,
        videoUrl: ex.videoUrl,
        imageUrl: ex.imageUrl,
        source: ex.isCustom ? 'custom' : 'db',
        primaryMuscles: ex.muscleGroup ? [ex.muscleGroup] : [],
        muscleSlugs: ex.muscleGroup ? [ex.muscleGroup] : [],
        hasSvg: false,
      });
    }
  }

  if (includeAnatome) {
    for (const ex of anatomeFiltered) {
      if (dbNames.has(ex.name.toLowerCase())) continue;

      merged.push({
        id: `anatome:${ex.id}`,
        svgId: ex.id,
        name: ex.name,
        bodyPart: ex.bodyPart,
        muscleGroup: ex.bodyPart,
        muscleSlugs: ex.muscleSlugs || [],
        primaryMuscles: ex.primaryMuscles || [],
        secondaryMuscles: ex.secondaryMuscles || [],
        isCustom: false,
        source: 'anatome',
        hasSvg: true,
      });
    }
  }

  merged.sort((a, b) => a.name.localeCompare(b.name));

  const total = merged.length;
  const sliced = merged.slice(offset, offset + limit);

  return { exercises: sliced, total };
}

export async function getUnifiedExercise(userId, id) {
  if (id.startsWith('anatome:')) {
    const anatomeId = id.slice('anatome:'.length);
    const { exercises } = await loadAnatomeExercises();
    const ex = exercises.find((e) => e.id === anatomeId);
    if (!ex) return null;
    return {
      id,
      name: ex.name,
      muscleGroup: ex.bodyPart,
      bodyPart: ex.bodyPart,
      muscleSlugs: ex.muscleSlugs || [],
      primaryMuscles: ex.primaryMuscles || [],
      secondaryMuscles: ex.secondaryMuscles || [],
      isCustom: false,
      source: 'anatome',
      hasSvg: true,
      svgId: ex.id,
      instructions: ex.instructions || [],
      videoUrl: null,
    };
  }

  const ex = await prisma.exercise.findFirst({
    where: { id, OR: [{ userId: null }, { userId }] },
  });
  if (!ex) return null;

  return {
    id: ex.id,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment,
    isCustom: ex.isCustom,
    source: ex.isCustom ? 'custom' : 'db',
    videoUrl: ex.videoUrl,
    imageUrl: ex.imageUrl,
    primaryMuscles: ex.muscleGroup ? [ex.muscleGroup] : [],
    muscleSlugs: ex.muscleGroup ? [ex.muscleGroup] : [],
    hasSvg: false,
    instructions: ex.instructions || [],
    overview: ex.overview,
  };
}
EOF
echo "✅ server/src/services/unified-exercise.service.js"

# ============================================================
# 3. server/src/controllers/exercise.controller.js
#    Fix getExercise cho anatome id
# ============================================================
cat > server/src/controllers/exercise.controller.js <<'EOF'
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
    select: { muscleGroup: true, equipment: true },
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
    return res.json({ exercise: ex, stats: null, prs: [], sessions: [], muscleContributions: [] });
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
EOF
echo "✅ server/src/controllers/exercise.controller.js"

# ============================================================
# 4. Build test
# ============================================================
echo ""
echo "🔨 Build test..."
cd client
if npm run build 2>&1 | tail -5; then
  echo "✅ Build OK"
else
  echo "❌ Build FAILED"
  exit 1
fi
cd ..

echo ""
echo "================================================================"
echo "✅ FEATURE 39 hoàn tất"
echo "================================================================"
echo ""
echo "Commit + push:"
 git add client/src/pages/Exercises.jsx \\
        client/src/pages/ExerciseDetail.jsx \\
        server/src/services/unified-exercise.service.js \\
        server/src/controllers/exercise.controller.js
 git commit -m 'Feature 39: Server-side filter + Anatome SVG display'
  git push
echo ""