import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from '../components/Skeleton.jsx';

export default function Profile() {
  const { data, loading } = useFetch(() => api.get('/profile'), []);
  const streak = useFetch(() => api.get('/analytics/streak'), []);

  if (loading) return <Skeleton className="h-64" />;
  const u = data?.user;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Profile</h1>

      <div className="card p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center text-2xl">
            {(u?.name || u?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{u?.name || 'Athlete'}</div>
            <div className="text-sm text-ink-400 truncate">{u?.email}</div>
            <div className="text-xs text-ink-500 mt-1">
              Member since {new Date(u?.createdAt).toLocaleDateString()} ·{' '}
              {u?.googleId ? 'Google linked' : 'Password login'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-xs text-ink-400 uppercase">Current Streak</div>
          <div className="text-2xl font-semibold mt-1">
            {streak.data?.current || 0} days
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-400 uppercase">Longest Streak</div>
          <div className="text-2xl font-semibold mt-1">
            {streak.data?.longest || 0} days
          </div>
        </div>
      </div>
    </div>
  );
}