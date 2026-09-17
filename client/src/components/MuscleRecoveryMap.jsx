import { fmtNumber } from '../lib/format.js';

const MUSCLE_LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
};

function recoveryColor(percent) {
  if (percent >= 95) return '#c6ff3d'; // xanh — hồi phục đủ
  if (percent >= 75) return '#ffb038'; // vàng cam
  if (percent >= 50) return '#ff8f3d';
  if (percent >= 25) return '#ff5e5e';
  return '#8a1f1f'; // đỏ đậm — chưa hồi phục
}

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d.toFixed(1)}d`;
}

export default function MuscleRecoveryMap({ recovery = [] }) {
  const byGroup = {};
  for (const r of recovery) byGroup[r.muscleGroup] = r;

  const groups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'cardio'];

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">Muscle Recovery Map</div>
        <div className="flex items-center gap-2 text-[10px] text-ink-400">
          <span className="w-3 h-3 rounded" style={{ background: '#8a1f1f' }} />
          <span>Fatigued</span>
          <span className="w-3 h-3 rounded" style={{ background: '#ffb038' }} />
          <span>Recovering</span>
          <span className="w-3 h-3 rounded" style={{ background: '#c6ff3d' }} />
          <span>Ready</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {groups.map((g) => {
          const r = byGroup[g] || {
            muscleGroup: g,
            percent: 100,
            sets7d: 0,
            sets30d: 0,
            volume7d: 0,
            hoursRemaining: null,
            lastTrainedAt: null,
          };
          const color = recoveryColor(r.percent);
          const neverTrained = !r.lastTrainedAt;

          return (
            <div
              key={g}
              className="border border-ink-700 rounded-xl p-3 space-y-2"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wide text-ink-400">
                  {MUSCLE_LABELS[g]}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{ color }}
                >
                  {neverTrained ? '—' : `${r.percent}%`}
                </div>
              </div>

              <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${neverTrained ? 0 : r.percent}%`,
                    background: color,
                  }}
                />
              </div>

              <div className="text-[11px] text-ink-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>Sets 7d</span>
                  <span className="text-white">{r.sets7d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sets 30d</span>
                  <span className="text-white">{r.sets30d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vol 7d</span>
                  <span className="text-white">
                    {fmtNumber((r.volume7d || 0) / 1000, 1)}t
                  </span>
                </div>
                {!neverTrained && r.hoursRemaining != null && r.percent < 100 && (
                  <div className="flex justify-between">
                    <span>ETA</span>
                    <span className="text-white">{fmtHours(r.hoursRemaining)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
