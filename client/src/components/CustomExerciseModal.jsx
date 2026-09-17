import { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import Modal from './Modal.jsx';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

const MUSCLE_OPTIONS = [
  { group: 'chest', label: 'Chest', slugs: ['chest', 'upper-chest'] },
  { group: 'back', label: 'Back', slugs: ['lats', 'middle-back', 'lower-back', 'traps'] },
  { group: 'shoulders', label: 'Shoulders', slugs: ['front-delts', 'side-delts', 'rear-delts'] },
  { group: 'biceps', label: 'Biceps', slugs: ['biceps'] },
  { group: 'triceps', label: 'Triceps', slugs: ['triceps'] },
  { group: 'forearms', label: 'Forearms', slugs: ['forearms'] },
  { group: 'legs', label: 'Legs', slugs: ['quadriceps', 'hamstrings', 'glutes', 'calves'] },
  { group: 'core', label: 'Core', slugs: ['abs', 'obliques'] },
  { group: 'cardio', label: 'Cardio', slugs: ['cardio'] },
];

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'forearms', 'legs', 'core', 'cardio',
];

export default function CustomExerciseModal({
  open,
  onClose,
  onSaved,
  initialData,   // = { id, name, muscleGroup, equipment, muscleSlugs } nếu edit
}) {
  const toast = useToast();
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState({
    name: '',
    muscleGroup: 'chest',
    equipment: '',
    muscleSlugs: [],
  });
  const [saving, setSaving] = useState(false);

  // Reset form khi open / initialData thay đổi
  useEffect(() => {
    if (!open) return;
    if (initialData) {
      setForm({
        name: initialData.name || '',
        muscleGroup: initialData.muscleGroup || 'chest',
        equipment: initialData.equipment || '',
        muscleSlugs: Array.isArray(initialData.muscleSlugs)
          ? initialData.muscleSlugs
          : [],
      });
    } else {
      setForm({ name: '', muscleGroup: 'chest', equipment: '', muscleSlugs: [] });
    }
  }, [open, initialData]);

  const toggleSlug = (slug) => {
    setForm((f) => {
      const has = f.muscleSlugs.includes(slug);
      return {
        ...f,
        muscleSlugs: has
          ? f.muscleSlugs.filter((s) => s !== slug)
          : [...f.muscleSlugs, slug],
      };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast('Name required', 'error');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      muscleGroup: form.muscleGroup,
      equipment: form.equipment || null,
      muscleSlugs: form.muscleSlugs,
    };

    try {
      if (isEdit) {
        await api.put(`/exercises/${initialData.id}`, payload);
        toast('Exercise updated');
      } else {
        await api.post('/exercises', payload);
        toast('Exercise created');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Custom Exercise' : 'Create Custom Exercise'}
      wide
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Incline Smith Bench"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Muscle Group (chính)</label>
            <select
              className="input"
              value={form.muscleGroup}
              onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Equipment</label>
            <input
              className="input"
              value={form.equipment}
              onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              placeholder="barbell / dumbbell / machine"
            />
          </div>
        </div>

        <div>
          <div className="label">
            Muscle Slugs chi tiết ({form.muscleSlugs.length} đã chọn)
          </div>
          <div className="text-xs text-ink-400 mb-3">
            Chọn các nhóm cơ được tác động. VD: Incline Bench → chest + upper-chest + front-delts + triceps.
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {MUSCLE_OPTIONS.map((group) => (
              <div key={group.group}>
                <div className="text-xs uppercase tracking-wide text-ink-500 mb-1.5">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.slugs.map((slug) => {
                    const selected = form.muscleSlugs.includes(slug);
                    return (
                      <button
                        key={slug}
                        type="button"
                        onClick={() => toggleSlug(slug)}
                        className={`chip text-[11px] capitalize transition-all ${
                          selected
                            ? 'border-accent text-accent bg-accent/10'
                            : 'hover:border-ink-500'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3" />}
                        {slug.replace(/-/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {form.muscleSlugs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-ink-700">
              <div className="text-xs text-ink-400 mb-2">Đã chọn:</div>
              <div className="flex flex-wrap gap-1.5">
                {form.muscleSlugs.map((slug) => (
                  <span key={slug} className="chip text-[10px] capitalize border-accent">
                    {slug.replace(/-/g, ' ')}
                    <button
                      type="button"
                      onClick={() => toggleSlug(slug)}
                      className="ml-1 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-ink-700">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Exercise'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
