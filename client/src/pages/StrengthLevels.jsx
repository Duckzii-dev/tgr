import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import { fmtNumber } from '../lib/format.js';

const LEVEL_COLORS = {
  untrained: '#3a424f',
  beginner: '#5ed3ff',
  novice: '#c6ff3d',
  intermediate: '#ffb038',
  advanced: '#ff8f3d',
  elite: '#ff5e5e',
};

const ORDER = ['elite', 'advanced', 'intermediate', 'novice', 'beginner', 'untrained'];

export default function StrengthLevels() {
  const { data, loading, error, refresh } = useFetch(
    () => api.get('/strength/levels'),
    []
  );

  if (loading) return <Skeleton className="h-64" />;
  if (error)
    return (
      <div className="card p-4 text-red-400 text-sm">
        {error}{' '}
        <button className="underline ml-2" onClick={refresh}>
          Retry
        </button>
      </div>
    );

  const levels = (data?.levels || [])
    .slice()
    .sort((a, b) => {
      const ai = ORDER.indexOf(a.level || 'untrained');
      const bi = ORDER.indexOf(b.level || 'untrained');
      if (ai !== bi) return ai - bi;
      return b.best1RM - a.best1RM;
    });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Strength Levels</h1>
        <div className="text-sm text-ink-400 mt-1">
          {data?.assumedBodyweight
            ? 'Bodyweight assumed 70kg — log bodyweight to refine'
            : `Based on bodyweight ${data?.bodyweight}kg · ${data?.gender}`}
        </div>
      </div>

      {levels.length === 0 ? (
        <Empty
          title="No strength data yet"
          hint="Log some workouts with PRs to see levels."
        />
      ) : (
        <div className="space-y-2">
          {levels.map((l) => (
            <Link
              key={l.exercise.id}
              to={`/exercises/${l.exercise.id}`}
              className="card p-4 flex items-center gap-3 hover:border-accent/50"
            >
              <div
                className="w-2 h-12 rounded-full shrink-0"
                style={{ background: LEVEL_COLORS[l.level] || '#3a424f' }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.exercise.name}</div>
                <div className="text-xs text-ink-400 capitalize truncate">
                  {l.exercise.muscleGroup} · {l.hasStandards ? l.ratio + '× BW' : '—'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className="text-sm font-semibold"
                  style={{ color: LEVEL_COLORS[l.level] || '#8a93a0' }}
                >
                  {l.levelLabel}
                </div>
                {l.best1RM && (
                  <div className="text-xs text-ink-400">
                    {fmtNumber(l.best1RM, 1)}kg
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}