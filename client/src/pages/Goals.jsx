import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import Confirm from '../components/Confirm.jsx';
import { fmtNumber } from '../lib/format.js';

const TYPES = [
  { value: 'exercise_pr', label: 'Exercise PR' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'workout_count', label: 'Workout Count' },
  { value: 'gym_hours', label: 'Gym Hours' },
  { value: 'consistency', label: 'Consistency (weeks)' },
  { value: 'volume', label: 'Total Volume' },
];

export default function Goals() {
  const toast = useToast();
  const { data, loading, refresh } = useFetch(() => api.get('/goals'), []);
  const exercises = useFetch(() => api.get('/exercises'), []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'exercise_pr',
    title: '',
    target: '',
    unit: 'kg',
    exerciseId: '',
  });
  const [del, setDel] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        ...form,
        target: Number(form.target),
        exerciseId: form.exerciseId || undefined,
      });
      toast('Goal created');
      setOpen(false);
      setForm({ type: 'exercise_pr', title: '', target: '', unit: 'kg', exerciseId: '' });
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const doDelete = async () => {
    try {
      await api.del(`/goals/${del}`);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : data?.goals?.length ? (
        <div className="grid md:grid-cols-2 gap-3">
          {data.goals.map((g) => (
            <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-xs text-ink-400 capitalize">
                    {g.type.replace('_', ' ')}
                  </div>
                </div>
                <button
                  onClick={() => setDel(g.id)}
                  className="text-ink-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span>
                  {fmtNumber(g.current, 1)} / {fmtNumber(g.target, 1)} {g.unit || ''}
                </span>
                <span className="text-accent">{g.progress}%</span>
              </div>
              <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${g.progress}%` }}
                />
              </div>
              <div className="text-xs text-ink-400 mt-2">
                Remaining: {fmtNumber(g.remaining, 1)} {g.unit || ''}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="No goals"
          hint="Create a goal to track progress."
          action={
            <button className="btn btn-primary" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4" />New Goal
            </button>
          }
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Goal">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="label">Target</label>
              <input
                className="input"
                type="number"
                step="0.1"
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Unit</label>
              <input
                className="input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>
          {form.type === 'exercise_pr' && (
            <div>
              <label className="label">Exercise</label>
              <select
                className="input"
                value={form.exerciseId}
                onChange={(e) => setForm({ ...form, exerciseId: e.target.value })}
                required
              >
                <option value="">Select exercise</option>
                {exercises.data?.exercises?.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button className="btn btn-primary w-full justify-center">Create</button>
        </form>
      </Modal>

      <Confirm
        open={!!del}
        onClose={() => setDel(null)}
        onConfirm={doDelete}
        title="Delete goal?"
        confirmLabel="Delete"
      />
    </div>
  );
}