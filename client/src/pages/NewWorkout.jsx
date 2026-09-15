import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function NewWorkout() {
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [name, setName] = useState('');
  const [type, setType] = useState('strength');
  const [date, setDate] = useState(params.get('date') || todayISO());
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        name,
        workoutType: type,
        date,
        notes: notes || null,
      };
      if (duration && Number(duration) > 0) {
        body.duration = Number(duration) * 60; // minutes → seconds
      }
      const { workout } = await api.post('/workouts', body);

      // Nếu backfill có duration → set luôn startTime/endTime hợp lý
      if (body.duration) {
        const end = new Date(date + 'T20:00:00');
        const start = new Date(end.getTime() - body.duration * 1000);
        await api.put(`/workouts/${workout.id}`, {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
      }

      toast('Workout created');
      nav(`/workouts/${workout.id}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const backfill = date < todayISO();

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">
        {backfill ? 'Log Workout (Backfill)' : 'Start Workout'}
      </h1>
      <form onSubmit={submit} className="card p-5 space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Push Day"
            required
          />
        </div>

        <div>
          <label className="label">Type</label>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="recovery">Recovery</option>
          </select>
        </div>

        <div>
          <label className="label">Date</label>
          <input
            className="input"
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          <div className="text-xs text-ink-400 mt-1">
            Chọn ngày trong quá khứ nếu log bù.
          </div>
        </div>

        {backfill && (
          <div>
            <label className="label">Duration (minutes, optional)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="600"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="60"
            />
            <div className="text-xs text-ink-400 mt-1">
              Ước lượng thời gian tập để dashboard tính đúng.
            </div>
          </div>
        )}

        <div>
          <label className="label">Notes (optional)</label>
          <textarea
            className="input min-h-[70px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Điện thoại hết pin, log lại sau"
          />
        </div>

        <button
          className="btn btn-primary w-full justify-center"
          disabled={loading}
        >
          {loading ? 'Creating...' : backfill ? 'Log Backfill' : 'Start'}
        </button>
      </form>
    </div>
  );
}