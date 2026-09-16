import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Dumbbell, TrendingUp, Ban, Unlock, Globe } from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import Skeleton from '../components/Skeleton.jsx';
import StatCard from '../components/StatCard.jsx';
import Empty from '../components/Empty.jsx';
import { fmtDate, fmtDuration, fmtNumber } from '../lib/format.js';

export default function AdminUserDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { data, loading, error, refresh } = useFetch(
    () => api.get(`/admin/users/${id}`),
    [id]
  );

  const unban = async () => {
    try {
      await api.post(`/admin/users/${id}/unban`);
      toast('Unbanned');
      refresh();
    } catch (e) { toast(e.message, 'error'); }
  };

  const blockIp = async () => {
    try {
      await api.post(`/admin/users/${id}/block-ip`);
      toast('IP blocked');
    } catch (e) { toast(e.message, 'error'); }
  };

  if (loading) return <Skeleton className="h-64" />;
  if (error) return <Empty title={error} />;
  if (!data) return <Empty title="User not found" />;

  const { user, recentWorkouts } = data;

  return (
    <div className="space-y-4">
      <Link to="/admin" className="btn btn-ghost inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-ink-800 flex items-center justify-center text-2xl">
            {(user.name || user.email || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold truncate flex items-center gap-2">
              {user.name || '—'}
              {user.role === 'admin' && (
                <span className="chip border-accent text-accent text-[10px]">ADMIN</span>
              )}
              {user.isBanned && (
                <span className="chip border-red-500 text-red-400 text-[10px]">
                  BANNED
                </span>
              )}
            </div>
            <div className="text-sm text-ink-400 truncate">{user.email}</div>
            <div className="text-xs text-ink-500 mt-1">
              {user.timezone} · Joined {fmtDate(user.createdAt)} · Last login{' '}
              {user.lastLoginAt ? fmtDate(user.lastLoginAt) : 'never'}
              {user.lastLoginIp && ` (${user.lastLoginIp})`}
            </div>
            {user.isBanned && user.bannedReason && (
              <div className="text-xs text-red-400 mt-1">
                Reason: {user.bannedReason}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {user.isBanned ? (
              <button className="btn btn-ghost" onClick={unban}>
                <Unlock className="w-4 h-4" /> Unban
              </button>
            ) : (
              <Link to="/admin" className="btn btn-ghost">
                <Ban className="w-4 h-4" /> Ban (từ list)
              </Link>
            )}
            {user.lastLoginIp && (
              <button className="btn btn-ghost" onClick={blockIp}>
                <Globe className="w-4 h-4" /> Block IP
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Workouts" value={user._count.workouts} icon={Dumbbell} />
        <StatCard label="Bodyweights" value={user._count.bodyWeights} />
        <StatCard label="Goals" value={user._count.goals} />
        <StatCard label="PRs" value={user._count.personalRecords} icon={TrendingUp} />
      </div>

      <div className="card p-4">
        <div className="font-semibold mb-3">Recent Workouts</div>
        {recentWorkouts.length ? (
          <div className="space-y-1">
            {recentWorkouts.map((w) => (
              <div
                key={w.id}
                className="flex justify-between p-2 rounded-lg bg-ink-850 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate">{w.name}</div>
                  <div className="text-xs text-ink-400">{fmtDate(w.date)}</div>
                </div>
                <div className="text-xs text-ink-400 text-right">
                  <div>{w.sets} sets</div>
                  <div>{fmtNumber(w.volume / 1000, 1)}t</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No workouts" />
        )}
      </div>
    </div>
  );
}