import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import { useToast } from '../lib/toast.jsx';

const GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs'];

export default function Exercises() {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', muscleGroup: 'chest', equipment: '' });

  const { data, loading, error, refresh } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (group) p.set('muscleGroup', group);
      return api.get(`/exercises?${p}`);
    },
    [q, group]
  );

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/exercises', form);
      toast('Exercise created');
      setCreateOpen(false);
      setForm({ name: '', muscleGroup: 'chest', equipment: '' });
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const grouped = (data?.exercises || []).reduce((acc, ex) => {
    (acc[ex.muscleGroup] = acc[ex.muscleGroup] || []).push(ex);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Exercises</h1>
        <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Custom
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="">All muscle groups</option>
          {GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : Object.keys(grouped).length ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([g, list]) => (
            <div key={g}>
              <div className="text-sm text-ink-400 uppercase tracking-wide mb-2 capitalize">
                {g}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {list.map((ex) => (
                  <Link
                    key={ex.id}
                    to={`/exercises/${ex.id}`}
                    className="card p-3 hover:border-accent/50"
                  >
                    <div className="font-medium text-sm">{ex.name}</div>
                    <div className="text-xs text-ink-400">
                      {ex.equipment || '—'}
                      {ex.isCustom ? ' · custom' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No exercises match" />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Custom Exercise">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Muscle Group</label>
            <select
              className="input"
              value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Equipment</label>
            <input
              className="input"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
            />
          </div>
          <button className="btn btn-primary w-full justify-center">Create</button>
        </form>
      </Modal>
    </div>
  );
}