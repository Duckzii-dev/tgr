import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import TrainingLoadCard from '../components/TrainingLoadCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import { fmtDuration, fmtNumber } from '../lib/format.js';

export default function Analytics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, refresh } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      return api.get(`/analytics/overview?${p}`);
    },
    [from, to]
  );
  const streak = useFetch(() => api.get('/analytics/streak'), []);

  const totalGymHours = ((data?.totalDuration || 0) / 3600).toFixed(1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="label">From</label>
          <input
            className="input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="label">To</label>
          <input
            className="input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          className="btn btn-ghost self-end"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Reset
        </button>
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
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Workouts" value={fmtNumber(data?.totalWorkouts)} />
          <StatCard label="Total Gym Hours" value={totalGymHours} />
          <StatCard label="Avg Session" value={fmtDuration(data?.avgSession)} />
          <StatCard label="Max Session" value={fmtDuration(data?.maxSession)} />
          <StatCard label="Total Sets" value={fmtNumber(data?.totalSets)} />
          <StatCard label="Total Reps" value={fmtNumber(data?.totalReps)} />
          <StatCard
            label="Volume"
            value={`${fmtNumber((data?.totalVolume || 0) / 1000, 1)}t`}
          />
          <StatCard
            label="Streak"
            value={`${streak.data?.current || 0}d`}
            sub={`Longest ${streak.data?.longest || 0}d`}
          />
        </div>
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <TrainingLoadCard
            title="Training Load — by Day of Week"
            data={data?.trainingLoadByDow || []}
            xKey="dow"
            defaultMetric="sets"
          />

          <TrainingLoadCard
            title="Training Load — by Week"
            data={data?.trainingLoadByWeek || []}
            xKey="week"
            defaultMetric="volume"
          />
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="font-semibold mb-2">Weekly Gym Time (hours)</div>
          {data?.weeklyDuration?.length ? (
            <LineChartCard
              data={data.weeklyDuration.map((w) => ({
                week: w.week,
                hours: +(w.seconds / 3600).toFixed(2),
              }))}
              xKey="week"
              lines={[{ key: 'hours', name: 'hours' }]}
            />
          ) : (
            <Empty title="No data" />
          )}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Monthly Gym Time (hours)</div>
          {data?.monthlyDuration?.length ? (
            <LineChartCard
              data={data.monthlyDuration.map((m) => ({
                month: m.month,
                hours: +(m.seconds / 3600).toFixed(2),
              }))}
              xKey="month"
              lines={[{ key: 'hours', name: 'hours', color: '#5ed3ff' }]}
            />
          ) : (
            <Empty title="No data" />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="font-semibold mb-3">Muscle Group Volume</div>
          {data?.muscleVolume?.length ? (
            <div className="space-y-2">
              {[...data.muscleVolume]
                .sort((a, b) => b.volume - a.volume)
                .map((m) => {
                  const max = Math.max(...data.muscleVolume.map((x) => x.volume));
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
            <Empty title="No data" />
          )}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-3">Exercise Frequency</div>
          {data?.exerciseFrequency?.length ? (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.exerciseFrequency.map((e) => (
                <div
                  key={e.name}
                  className="flex justify-between p-2 rounded-lg bg-ink-850 text-sm"
                >
                  <span>{e.name}</span>
                  <span className="text-ink-400">{e.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No data" />
          )}
        </div>
      </div>
    </div>
  );
}