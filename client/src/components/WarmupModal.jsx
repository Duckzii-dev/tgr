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
