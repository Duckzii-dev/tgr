import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Modal from '../components/Modal.jsx';
import { fmtDate } from '../lib/format.js';

const RANGES = { '7D': 7, '30D': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 99999 };

export default function Progress() {
  const [range, setRange] = useState('3M');
  const toast = useToast();
  const { data, loading, refresh } = useFetch(() => api.get('/bodyweight/stats'), []);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    weight: '',
    recordedAt: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const filtered = (data?.records || []).filter((r) => {
    if (range === 'ALL') return true;
    const d = new Date();
    d.setDate(d.getDate() - RANGES[range]);
    return new Date(r.recordedAt) >= d;
  });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/bodyweight', form);
      setAddOpen(false);
      setForm({
        weight: '',
        recordedAt: new Date().toISOString().slice(0, 10),
        notes: '',
      });
      toast('Logged');
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const remove = async (id) => {
    try {
      await api.del(`/bodyweight/${id}`);
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const stats = data?.stats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Bodyweight</h1>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" /> Log
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-24" />
      ) : (
        stats?.current != null && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Current" value={`${stats.current}kg`} />
            <StatCard label="Starting" value={`${stats.starting}kg`} />
            <StatCard label="Lowest" value={`${stats.lowest}kg`} />
            <StatCard label="Highest" value={`${stats.highest}kg`} />
            <StatCard label="Average" value={`${stats.average}kg`} />
            <StatCard
              label="Change"
              value={`${stats.change > 0 ? '+' : ''}${stats.change}kg`}
            />
          </div>
        )
      )}

      <div className="card p-4">
        <div className="flex gap-1 mb-3 flex-wrap">
          {Object.keys(RANGES).map((r) => (
            <button
              key={r}
              className={`chip ${range === r ? 'border-accent text-accent' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
        {filtered.length ? (
          <LineChartCard
            data={filtered.map((r) => ({
              date: fmtDate(r.recordedAt),
              weight: r.weight,
            }))}
            lines={[{ key: 'weight', name: 'kg' }]}
            height={320}
          />
        ) : (
          <Empty title="No records in this range" />
        )}
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3">History</div>
        {data?.records?.length ? (
          <div className="space-y-1">
            {[...data.records].reverse().map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-lg bg-ink-850 text-sm"
              >
                <div>
                  {r.weight}kg{' '}
                  <span className="text-xs text-ink-400 ml-2">
                    {fmtDate(r.recordedAt)}
                  </span>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="text-ink-400 hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No records yet" />
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Log Bodyweight">
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Weight (kg)</label>
            <input
              className="input"
              type="number"
              step="0.1"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              className="input"
              type="date"
              value={form.recordedAt}
              onChange={(e) => setForm({ ...form, recordedAt: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <button className="btn btn-primary w-full justify-center">Save</button>
        </form>
      </Modal>
    </div>
  );
}