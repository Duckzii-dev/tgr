import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

export default function NewWorkout() {
  const nav = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('strength');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { workout } = await api.post('/workouts', {
        name,
        workoutType: type,
        date,
      });
      toast('Workout started');
      nav(`/workouts/${workout.id}`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Start Workout</h1>
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
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <button className="btn btn-primary w-full justify-center" disabled={loading}>
          {loading ? 'Starting...' : 'Start'}
        </button>
      </form>
    </div>
  );
}