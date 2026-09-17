import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, Timer, Check, Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Modal from '../components/Modal.jsx';
import Confirm from '../components/Confirm.jsx';
import RestTimer from '../components/RestTimer.jsx';
import Empty from '../components/Empty.jsx';
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

  const addSet = async (weId, payload) => {
    try {
      await api.post(`/workouts/exercises/${weId}/sets`, payload);
      refresh();
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
    (s, we) => s + we.sets.reduce((a, x) => a + x.weight * x.reps, 0),
    0
  );
  const totalSets = w.exercises.reduce((s, we) => s + we.sets.length, 0);

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

      {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}

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
          onAdd={addSet}
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

function ExerciseBlock({ we, onAdd, onUpdate, onDelete, onDup, onRemove }) {
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

      <div className="space-y-1 mb-3">
        {we.sets.map((s, i) => (
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