import { Link } from 'react-router-dom';
import {
  Dumbbell, Clock, Flame, TrendingUp, Trophy, BarChart3,
} from 'lucide-react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import { fmtDuration, fmtNumber, fmtDate } from '../lib/format.js';

export default function Dashboard() {
  const analytics = useFetch(() => api.get('/analytics/overview'), []);
  const streak = useFetch(() => api.get('/analytics/streak'), []);
  const bw = useFetch(() => api.get('/bodyweight/stats'), []);
  const recent = useFetch(() => api.get('/workouts'), []);
  const prs = useFetch(() => api.get('/prs/recent'), []);

  const totalPRs = prs.data?.prs?.length || 0;
  const a = analytics.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Link to="/workouts/new" className="btn btn-primary">
          Start Workout
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {analytics.loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <>
            <StatCard label="Workouts" value={fmtNumber(a?.totalWorkouts)} icon={Dumbbell} />
            <StatCard label="Gym Time" value={fmtDuration(a?.totalDuration)} icon={Clock} />
            <StatCard
              label="Streak"
              value={`${streak.data?.current || 0}d`}
              sub={`Longest ${streak.data?.longest || 0}d`}
              icon={Flame}
            />
            <StatCard
              label="Volume"
              value={`${fmtNumber((a?.totalVolume || 0) / 1000, 1)}t`}
              icon={TrendingUp}
            />
            <StatCard label="Total PRs" value={fmtNumber(totalPRs)} icon={Trophy} />
            <StatCard label="Avg Session" value={fmtDuration(a?.avgSession)} icon={BarChart3} />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Bodyweight</div>
            {bw.data?.stats?.current != null && (
              <div className="text-xs text-ink-400">
                Current {bw.data.stats.current}kg · Δ
                {bw.data.stats.change > 0 ? '+' : ''}
                {bw.data.stats.change}kg
              </div>
            )}
          </div>
          {bw.loading ? (
            <Skeleton className="h-64" />
          ) : bw.data?.records?.length ? (
            <LineChartCard
              data={bw.data.records.map((r) => ({
                date: fmtDate(r.recordedAt),
                weight: r.weight,
              }))}
              lines={[{ key: 'weight', name: 'kg' }]}
            />
          ) : (
            <Empty title="No bodyweight logged" />
          )}
        </div>

        <div className="card p-4">
          <div className="font-semibold mb-3">Volume by Muscle Group</div>
          {analytics.loading ? (
            <Skeleton className="h-64" />
          ) : a?.muscleVolume?.length ? (
            <div className="space-y-2">
              {[...a.muscleVolume]
                .sort((x, y) => y.volume - x.volume)
                .map((m) => {
                  const max = Math.max(...a.muscleVolume.map((x) => x.volume));
                  return (
                    <div key={m.muscleGroup}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{m.muscleGroup}</span>
                        <span className="text-ink-400">
                          {fmtNumber(m.volume / 1000, 1)}t
                        </span>
                      </div>
                      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(m.volume / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <Empty title="No volume data" />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <div className="font-semibold mb-3">Recent Workouts</div>
          {recent.loading ? (
            <Skeleton className="h-40" />
          ) : recent.data?.workouts?.length ? (
            <div className="space-y-2">
              {recent.data.workouts.slice(0, 5).map((w) => (
                <Link
                  key={w.id}
                  to={`/workouts/${w.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-ink-850"
                >
                  <div>
                    <div className="text-sm">{w.name}</div>
                    <div className="text-xs text-ink-400">
                      {fmtDate(w.date)} · {fmtDuration(w.duration)}
                    </div>
                  </div>
                  <div className="text-xs text-ink-400 text-right">
                    <div>{w.sets} sets</div>
                    <div>{fmtNumber(w.volume / 1000, 1)}t</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="No workouts yet"
              action={
                <Link to="/workouts/new" className="btn btn-primary">
                  Start first workout
                </Link>
              }
            />
          )}
        </div>

        <div className="card p-4">
          <div className="font-semibold mb-3">Recent PRs</div>
          {prs.loading ? (
            <Skeleton className="h-40" />
          ) : prs.data?.prs?.length ? (
            <div className="space-y-2">
              {prs.data.prs.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-ink-850"
                >
                  <div>
                    <div className="text-sm">{p.exercise.name}</div>
                    <div className="text-xs text-ink-400 capitalize">
                      {p.type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-accent">
                    {fmtNumber(p.value, 1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No PRs yet" icon={Trophy} />
          )}
        </div>
      </div>
    </div>
  );
}