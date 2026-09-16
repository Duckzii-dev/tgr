import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import Confirm from '../components/Confirm.jsx';
import { fmtDate, fmtDuration, fmtNumber } from '../lib/format.js';

export default function Workouts() {
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [hasPR, setHasPR] = useState(false);

  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data, loading, error, refresh } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      if (minVolume) p.set('minVolume', minVolume);
      if (hasPR) p.set('hasPR', 'true');
      return api.get(`/workouts?${p}`);
    },
    [q, from, to, minVolume, hasPR]
  );

  const workouts = data?.workouts || [];
  const allSelected = workouts.length > 0 && workouts.every((w) => selected.has(w.id));
  const someSelected = selected.size > 0;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(workouts.map((w) => w.id)));
  };

  const clearSelection = () => setSelected(new Set());

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const res = await api.post('/workouts/bulk-delete', { ids: [...selected] });
      toast(`Deleted ${res.deleted} workout${res.deleted > 1 ? 's' : ''}`);
      clearSelection();
      refresh();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-semibold">Workouts</h1>
        <div className="flex items-center gap-2">
          {workouts.length > 0 && (
            <button
              className="btn btn-ghost"
              onClick={toggleAll}
              title={allSelected ? 'Deselect all' : 'Select all'}
            >
              {allSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" /> Deselect all
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" /> Select all
                </>
              )}
            </button>
          )}
          <Link to="/workouts/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New
          </Link>
        </div>
      </div>

      <div className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="relative col-span-2 md:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-ink-400" />
          <input
            className="input pl-9"
            placeholder="Search name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        <input
          className="input"
          placeholder="Min volume (kg)"
          value={minVolume}
          onChange={(e) => setMinVolume(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink-300">
          <input type="checkbox" checked={hasPR} onChange={(e) => setHasPR(e.target.checked)} /> PRs only
        </label>
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {someSelected && (
        <div className="sticky top-2 z-20 card p-3 flex items-center justify-between border-accent/40 bg-ink-850">
          <div className="text-sm">
            <span className="text-accent font-semibold">{selected.size}</span> selected
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={clearSelection}>
              <X className="w-4 h-4" /> Clear
            </button>
            <button
              className="btn bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              onClick={() => setConfirmOpen(true)}
              disabled={bulkDeleting}
            >
              <Trash2 className="w-4 h-4" />
              Delete {selected.size}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : workouts.length ? (
        <div className="space-y-2">
          {workouts.map((w) => {
            const isSel = selected.has(w.id);
            return (
              <div
                key={w.id}
                className={`card p-4 flex items-center gap-3 transition-colors ${
                  isSel ? 'border-accent/60 bg-ink-850' : 'hover:border-accent/40'
                }`}
              >
                <button
                  onClick={() => toggle(w.id)}
                  className="shrink-0 text-ink-400 hover:text-accent"
                  aria-label={isSel ? 'Deselect' : 'Select'}
                >
                  {isSel ? (
                    <CheckSquare className="w-5 h-5 text-accent" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => nav(`/workouts/${w.id}`)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="font-medium truncate">{w.name}</div>
                  <div className="text-xs text-ink-400">
                    {fmtDate(w.date)} · {fmtDuration(w.duration)} · {w.workoutType}
                  </div>
                </button>

                <div className="flex items-center gap-4 text-xs text-ink-400 shrink-0">
                  <div className="text-right">
                    <div className="text-white">{w.sets}</div>
                    <div>sets</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">{fmtNumber(w.volume / 1000, 1)}t</div>
                    <div>volume</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No workouts match"
          action={
            <Link to="/workouts/new" className="btn btn-primary">
              Create one
            </Link>
          }
        />
      )}

      <Confirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={bulkDelete}
        title={`Delete ${selected.size} workout${selected.size > 1 ? 's' : ''}?`}
        body="Toàn bộ set, exercise và PR liên quan trong các workout này sẽ bị xoá vĩnh viễn."
        confirmLabel="Delete"
      />
    </div>
  );
}
