import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, Timer, Check } from 'lucide-react';
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
  const [showTimer, setShowTimer] = useState(false);
  const [deleteSet, setDeleteSet] = useState(null);
  const [deleteEx, setDeleteEx] = useState(null);
  const [summary, setSummary] = useState(null);

  const openAdd = async () => {
    setAddOpen(true);
    try {
      const res = await api.get('/exercises');
      setExercises(res.exercises);
    } catch {}
  };

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
    try {
      await api.del(`/workouts/sets/${deleteSet}`);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const doDeleteEx = async () => {
    try {
      await api.del(`/workouts/${id}/exercises/${deleteEx}`);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const dupPrev = async (weId) => {
    try {
      const res = await api.post(`/workouts/exercises/${weId}/duplicate-previous`);
      toast(`Copied ${res.created} sets`);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const finish = async () => {
    try {
      const res = await api.post(`/workouts/${id}/finish`);
      setSummary(res.summary);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const doDelete = async () => {
    try {
      await api.del(`/workouts/${id}`);
      nav('/workouts');
    } catch (e) {
      toast(e.message, 'error');
    }
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
          <button className="btn btn-primary" onClick={finish}>
            <Check className="w-4 h-4" /> Finish
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
        <div className="max-h-80 overflow-y-auto space-y-1">
          {exercises.map((ex) => (
            <button
              key={ex.id}
              onClick={() => addExercise(ex.id)}
              className="w-full text-left p-2 rounded-lg hover:bg-ink-850 flex items-center justify-between"
            >
              <div>
                <div className="text-sm">{ex.name}</div>
                <div className="text-xs text-ink-400 capitalize">
                  {ex.muscleGroup} · {ex.equipment || '—'}
                </div>
              </div>
              <Plus className="w-4 h-4 text-ink-400" />
            </button>
          ))}
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
      restSeconds: 90,
    });
    setWeight('');
    setReps('');
    setRir('');
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
        <div className="col-span-3">
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
            value={rir}
            onChange={(e) => setRir(e.target.value)}
          />
        </div>
        <button className="btn btn-primary col-span-4 justify-center">
          <Plus className="w-4 h-4" /> Add Set
        </button>
      </form>
    </div>
  );
}

function SetRow({ s, index, onUpdate, onDelete }) {
  const [weight, setWeight] = useState(s.weight);
  const [reps, setReps] = useState(s.reps);
  const commit = () => {
    if (weight !== s.weight || reps !== s.reps)
      onUpdate(s.id, { weight: Number(weight), reps: Number(reps) });
  };
  return (
    <div className="grid grid-cols-12 gap-2 items-center bg-ink-850 rounded-lg px-2 py-1.5">
      <div className="col-span-1 text-xs text-ink-400">#{index}</div>
      <input
        className="input col-span-3 py-1"
        type="number"
        step="0.5"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
      />
      <div className="col-span-1 text-center text-ink-400 text-xs">×</div>
      <input
        className="input col-span-3 py-1"
        type="number"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
      />
      <div className="col-span-2 text-xs text-ink-400 text-center">
        {s.estimated1RM ? `${s.estimated1RM.toFixed(1)} 1RM` : '—'}
      </div>
      <div className="col-span-1 text-right">
        <button onClick={onDelete} className="text-ink-400 hover:text-red-400">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}