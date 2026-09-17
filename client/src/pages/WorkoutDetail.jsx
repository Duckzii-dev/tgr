import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, Timer, Check, Search, Flame, X, Loader } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Modal from '../components/Modal.jsx';
import Confirm from '../components/Confirm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import WarmupModal from '../components/WarmupModal.jsx';
import Empty from '../components/Empty.jsx';
import LazySvg from '../components/LazySvg.jsx';
import { startRestTimer } from '../components/RestTimerHost.jsx';
import { getRestTimerSettings } from '../lib/restTimerSettings.js';
import { fmtDate, fmtDuration, fmtNumber } from '../lib/format.js';

const PAGE_SIZE = 40;

const MUSCLE_FILTERS = [
  '', 'chest', 'upper-chest',
  'lats', 'middle-back', 'lower-back', 'traps',
  'front-delts', 'side-delts', 'rear-delts',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'glutes', 'quadriceps', 'hamstrings', 'calves',
];

export default function WorkoutDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { data, loading, refresh } = useFetch(() => api.get(`/workouts/${id}`), [id]);

  const [addOpen, setAddOpen] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [deleteSet, setDeleteSet] = useState(null);
  const [deleteEx, setDeleteEx] = useState(null);
  const [summary, setSummary] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [warmupFor, setWarmupFor] = useState(null);

  const openAdd = () => setAddOpen(true);

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
            ? { name: we.exercise?.name, weight: payload?.weight, reps: payload?.reps }
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
      s + we.sets.reduce((a, x) => a + (x.isWarmup ? 0 : x.weight * x.reps), 0),
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
              <Plus className="w-4 h-4" /> Add Exercise
            </button>
          }
        />
      )}

      {w.exercises.map((we) => (
        <ExerciseBlock
          key={we.id}
          we={we}
          onAdd={(weId, payload) => addSet(weId, payload, we)}
          onWarmup={(workingWeight) => setWarmupFor({ weId: we.id, workingWeight })}
          onUpdate={updateSet}
          onDelete={(sid) => setDeleteSet(sid)}
          onDup={() => dupPrev(we.id)}
          onRemove={() => setDeleteEx(we.id)}
        />
      ))}

      {/* Add Exercise Modal — filter server-side */}
      <AddExerciseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onPick={addExercise}
      />

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

// ============================================================
// Add Exercise Modal — server-side filter + infinite scroll
// ============================================================
function AddExerciseModal({ open, onClose, onPick }) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [muscleSlug, setMuscleSlug] = useState('');

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);

  const offsetRef = useRef(0);
  const sentinelRef = useRef(null);
  const requestIdRef = useRef(0);

  // Reset khi mở modal
  useEffect(() => {
    if (!open) return;
    setQ('');
    setDebouncedQ('');
    setMuscleSlug('');
    setItems([]);
    setTotal(0);
    setHasMore(true);
    setError(null);
    offsetRef.current = 0;
  }, [open]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Load page
  const loadPage = useCallback(async (reset) => {
    if (!open) return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    const offset = reset ? 0 : offsetRef.current;
    const p = new URLSearchParams();
    if (debouncedQ) p.set('q', debouncedQ);
    if (muscleSlug) p.set('muscleSlug', muscleSlug);
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
  }, [open, debouncedQ, muscleSlug]);

  // Reset + load khi filter đổi
  useEffect(() => {
    if (!open) return;
    setItems([]);
    setTotal(0);
    setHasMore(true);
    offsetRef.current = 0;
    setError(null);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedQ, muscleSlug]);

  // Infinite scroll
  useEffect(() => {
    if (!open || !hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadPage(false); },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [open, hasMore, loading, loadPage]);

  return (
    <Modal open={open} onClose={onClose} title="Add Exercise" wide>
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            autoFocus
            className="input pl-9"
            placeholder="Tìm bài tập (vd: bench, squat, curl)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Muscle filter */}
        <div className="flex flex-wrap gap-1">
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

        {/* Result count */}
        {(muscleSlug || debouncedQ) && (
          <div className="text-xs text-ink-400">
            {muscleSlug && <span className="capitalize text-accent">{muscleSlug}</span>}
            {debouncedQ && <span className="ml-2">· "{debouncedQ}"</span>}
            <span className="ml-2">→ {total} kết quả</span>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-sm">
            {error}{' '}
            <button className="underline ml-2" onClick={() => loadPage(true)}>
              Retry
            </button>
          </div>
        )}

        {/* List */}
        <div className="max-h-[400px] overflow-y-auto space-y-1 -mx-2 px-2">
          {items.length === 0 && loading ? (
            <div className="space-y-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-sm text-ink-400 py-8">
              Không tìm thấy bài tập nào
            </div>
          ) : (
            <>
              {items.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onPick(ex.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-ink-850 flex items-center gap-3 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded bg-ink-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {ex.hasSvg ? (
                      <LazySvg exerciseId={ex.svgId || ex.id} className="w-full h-full p-1" />
                    ) : ex.videoUrl ? (
                      <video
                        src={ex.videoUrl}
                        muted loop playsInline preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[8px] text-ink-500">No media</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{ex.name}</div>
                    <div className="text-xs text-ink-400 capitalize truncate">
                      {ex.muscleGroup || ex.bodyPart || '—'}
                      {ex.equipment && ` · ${ex.equipment}`}
                      {ex.isCustom && ' · custom'}
                    </div>
                    {ex.muscleSlugs?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ex.muscleSlugs.slice(0, 4).map((slug) => (
                          <span
                            key={slug}
                            className="chip text-[9px] capitalize border-accent/30"
                          >
                            {slug.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <Plus className="w-4 h-4 text-ink-400 shrink-0" />
                </button>
              ))}

              {/* Load more sentinel */}
              {hasMore && (
                <div ref={sentinelRef} className="flex justify-center py-3">
                  {loading ? (
                    <Loader className="w-4 h-4 animate-spin text-ink-400" />
                  ) : (
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => loadPage(false)}
                    >
                      Load more
                    </button>
                  )}
                </div>
              )}

              {!hasMore && items.length > 0 && (
                <div className="text-center text-xs text-ink-500 py-2">
                  Đã hiển thị toàn bộ {items.length} bài tập
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
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
          >
            <Flame className="w-3 h-3" /> Warm-up
          </button>
          <button className="btn btn-ghost text-xs" onClick={onDup}>
            <Copy className="w-3 h-3" />
          </button>
          <button className="btn btn-ghost text-xs" onClick={onRemove}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {warmupSets.length > 0 && (
        <div className="mb-3 space-y-1 opacity-70">
          <div className="text-[10px] uppercase tracking-wide text-ink-500">Warm-up</div>
          {warmupSets.map((s, i) => (
            <div key={s.id}
              className="grid grid-cols-12 gap-2 items-center bg-ink-900/60 rounded-lg px-2 py-1.5">
              <div className="col-span-1 text-xs text-ink-500">W{i + 1}</div>
              <div className="col-span-2 text-sm text-ink-300">{s.weight}kg</div>
              <div className="col-span-1 text-center text-ink-500 text-xs">×</div>
              <div className="col-span-2 text-sm text-ink-300">{s.reps}</div>
              <div className="col-span-4 text-xs text-ink-500 text-center">
                {s.restSeconds ? `rest ${s.restSeconds}s` : '—'}
              </div>
              <div className="col-span-2 text-right">
                <button onClick={() => onDelete(s.id)}
                  className="text-ink-500 hover:text-red-400">
                  <Trash2 className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1 mb-3">
        {workingSets.map((s, i) => (
          <SetRow key={s.id} s={s} index={i + 1}
            onUpdate={onUpdate} onDelete={() => onDelete(s.id)} />
        ))}
      </div>

      <form onSubmit={submit} className="grid grid-cols-12 gap-2 items-end">
        <div className="col-span-3">
          <label className="label">Weight</label>
          <input className="input" type="number" step="0.5"
            value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Reps</label>
          <input className="input" type="number"
            value={reps} onChange={(e) => setReps(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">RIR</label>
          <input className="input" type="number" min="0" max="10" placeholder="—"
            value={rir} onChange={(e) => setRir(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">RPE</label>
          <input className="input" type="number" min="1" max="10" step="0.5" placeholder="—"
            value={rpe} onChange={(e) => setRpe(e.target.value)} />
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
      <input className="input col-span-2 py-1" type="number" step="0.5"
        value={weight} onChange={(e) => setWeight(e.target.value)} onBlur={commit} />
      <div className="col-span-1 text-center text-ink-400 text-xs">×</div>
      <input className="input col-span-2 py-1" type="number"
        value={reps} onChange={(e) => setReps(e.target.value)} onBlur={commit} />
      <input className="input col-span-2 py-1" type="number" min="0" max="10"
        placeholder="RIR" value={rir}
        onChange={(e) => setRir(e.target.value)} onBlur={commit} />
      <input className="input col-span-2 py-1" type="number" min="1" max="10" step="0.5"
        placeholder="RPE" value={rpe}
        onChange={(e) => setRpe(e.target.value)} onBlur={commit} />
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
