import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { fmtNumber } from '../lib/format.js';

const METRICS = {
  sets: { label: 'Sets', key: 'sets', color: '#c6ff3d', format: (v) => v },
  reps: { label: 'Reps', key: 'reps', color: '#5ed3ff', format: (v) => v },
  volume: {
    label: 'Volume (kg)',
    key: 'volume',
    color: '#b494ff',
    format: (v) => fmtNumber(v / 1000, 1) + 't',
  },
  avgRir: {
    label: 'Avg RIR',
    key: 'avgRir',
    color: '#ffb038',
    format: (v) => (v == null ? '—' : v.toFixed(2)),
  },
};

function rirColor(rir) {
  if (rir == null) return '#3a424f';
  if (rir <= 1) return '#ff5e5e'; // failure / very close
  if (rir <= 2) return '#ffb038';
  if (rir <= 3) return '#c6ff3d';
  return '#5ed3ff'; // far from failure
}

export default function TrainingLoadCard({
  title = 'Training Load',
  data = [],
  xKey = 'dow',
  defaultMetric = 'sets',
}) {
  const [metric, setMetric] = useState(defaultMetric);
  const cfg = METRICS[metric];

  const chartData = data.map((d) => ({
    ...d,
    [cfg.key]: d[cfg.key] ?? 0,
  }));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="font-semibold">{title}</div>
        <div className="flex gap-1 flex-wrap">
          {Object.entries(METRICS).map(([k, m]) => (
            <button
              key={k}
              className={`chip ${
                metric === k ? 'border-accent text-accent' : ''
              }`}
              onClick={() => setMetric(k)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#262c35" strokeDasharray="3 3" />
            <XAxis dataKey={xKey} stroke="#8a93a0" tick={{ fontSize: 11 }} />
            <YAxis
              stroke="#8a93a0"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) =>
                metric === 'volume' ? `${fmtNumber(v / 1000, 0)}t` : v
              }
            />
            <Tooltip
              contentStyle={{
                background: '#111317',
                border: '1px solid #262c35',
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(v) => [cfg.format(v), cfg.label]}
              labelFormatter={(label, payload) => {
                const p = payload?.[0]?.payload;
                if (!p) return label;
                const parts = [label];
                if (p.workoutCount != null) parts.push(`${p.workoutCount} workouts`);
                if (p.avgRir != null) parts.push(`avg RIR ${p.avgRir}`);
                return parts.join(' · ');
              }}
            />
            <Bar dataKey={cfg.key} radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    metric === 'avgRir'
                      ? rirColor(entry.avgRir)
                      : cfg.color
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}