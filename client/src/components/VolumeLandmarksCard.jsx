import { useEffect, useState } from 'react';
import { Settings2, RotateCcw, Save, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

const LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
};

export default function VolumeLandmarksCard({
  landmarks = [],
  onRefresh,
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // muscleGroup đang sửa
  const [form, setForm] = useState({ mev: '', mav: '', mrv: '' });

  useEffect(() => {
    if (!editing) return;
    const cur = landmarks.find((l) => l.muscleGroup === editing);
    if (cur) {
      setForm({
        mev: cur.mev ?? '',
        mav: cur.mav ?? '',
        mrv: cur.mrv ?? '',
      });
    }
  }, [editing, landmarks]);

  const save = async () => {
    try {
      await api.put(`/landmarks/${editing}`, {
        mev: form.mev !== '' ? Number(form.mev) : null,
        mav: form.mav !== '' ? Number(form.mav) : null,
        mrv: form.mrv !== '' ? Number(form.mrv) : null,
      });
      toast('Saved');
      setEditing(null);
      onRefresh?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const reset = async () => {
    try {
      await api.del(`/landmarks/${editing}`);
      toast('Reset to default');
      setEditing(null);
      onRefresh?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const groups = landmarks.filter((l) => l.muscleGroup !== 'cardio');

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">Volume Landmarks (sets/week)</div>
        <div className="text-xs text-ink-400">
          MEV = min effective · MAV = max adaptive · MRV = max recoverable
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((l) => {
          const max = Math.max(l.mrv || 0, l.currentSets || 0, 1);
          const mevPct = ((l.mev || 0) / max) * 100;
          const mavPct = ((l.mav || 0) / max) * 100;
          const mrvPct = ((l.mrv || 0) / max) * 100;
          const curPct = Math.min(100, ((l.currentSets || 0) / max) * 100);
          const isEditing = editing === l.muscleGroup;

          return (
            <div key={l.muscleGroup} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{LABELS[l.muscleGroup] || l.muscleGroup}</span>
                  {l.isCustom && (
                    <span className="text-[10px] uppercase chip">custom</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: l.status?.color || '#8a93a0' }}
                  >
                    {l.status?.label || '—'}
                  </span>
                  <button
                    className="text-ink-400 hover:text-white"
                    onClick={() => setEditing(isEditing ? null : l.muscleGroup)}
                    title="Edit landmarks"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!isEditing ? (
                <>
                  <div className="relative h-3 bg-ink-800 rounded-full overflow-hidden">
                    {/* MEV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-blue-400/60"
                      style={{ left: `${mevPct}%` }}
                      title={`MEV ${l.mev}`}
                    />
                    {/* MAV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-accent/60"
                      style={{ left: `${mavPct}%` }}
                      title={`MAV ${l.mav}`}
                    />
                    {/* MRV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/70"
                      style={{ left: `${mrvPct}%` }}
                      title={`MRV ${l.mrv}`}
                    />
                    {/* Current bar */}
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${curPct}%`,
                        background: l.status?.color || '#c6ff3d',
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-ink-400">
                    <span>
                      MEV {l.mev} · MAV {l.mav} · MRV {l.mrv}
                    </span>
                    <span>
                      Current: <span className="text-white">{l.currentSets}</span> sets
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-2 border border-ink-700 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">MEV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mev}
                        onChange={(e) => setForm({ ...form, mev: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">MAV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mav}
                        onChange={(e) => setForm({ ...form, mav: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">MRV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mrv}
                        onChange={(e) => setForm({ ...form, mrv: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => setEditing(null)}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button className="btn btn-ghost text-xs" onClick={reset}>
                      <RotateCcw className="w-3 h-3" /> Default
                    </button>
                    <button className="btn btn-primary text-xs" onClick={save}>
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
