import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import { fmtDate, fmtNumber } from '../lib/format.js';

const FILTERS = [
  { key: 'best', label: 'Best per exercise', path: '/prs/best' },
  { key: 'recent', label: 'Recent', path: '/prs/recent' },
  { key: 'all', label: 'All', path: '/prs' },
];

const TYPE_LABEL = {
  max_weight: 'Max Weight',
  estimated_1rm: 'Est. 1RM',
  max_reps: 'Max Reps',
  max_volume: 'Max Volume',
};

export default function PRs() {
  const [filter, setFilter] = useState('best');
  const path = FILTERS.find((f) => f.key === filter).path;
  const { data, loading, error, refresh } = useFetch(() => api.get(path), [path]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-semibold">Personal Records</h1>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={`chip ${filter === f.key ? 'border-accent text-accent' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : data?.prs?.length ? (
        <div className="space-y-2">
          {data.prs.map((p) => (
            <Link
              key={p.id}
              to={`/exercises/${p.exercise.id}`}
              className="card p-4 flex items-center justify-between hover:border-accent/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Trophy className="w-5 h-5 text-accent shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.exercise.name}</div>
                  <div className="text-xs text-ink-400">
                    {TYPE_LABEL[p.type] || p.type} · {fmtDate(p.achievedAt)}
                    {p.reps ? ` · ${p.weight}kg × ${p.reps}` : ''}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-accent">
                {fmtNumber(p.value, 1)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty
          title="No PRs yet"
          icon={Trophy}
          hint="Log sets to start tracking PRs automatically."
        />
      )}
    </div>
  );
}