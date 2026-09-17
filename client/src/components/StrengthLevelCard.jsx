import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import Skeleton from './Skeleton.jsx';
import { fmtNumber } from '../lib/format.js';

const LEVEL_COLORS = {
  untrained: '#3a424f',
  beginner: '#5ed3ff',
  novice: '#c6ff3d',
  intermediate: '#ffb038',
  advanced: '#ff8f3d',
  elite: '#ff5e5e',
};

export default function StrengthLevelCard({ exerciseId, gender = 'male' }) {
  const { data, loading, error } = useFetch(
    () => api.get(`/strength/level/${exerciseId}?gender=${gender}`),
    [exerciseId, gender]
  );

  if (loading) return <Skeleton className="h-48" />;
  if (error)
    return (
      <div className="card p-4 text-sm text-red-400">
        Strength level unavailable: {error}
      </div>
    );
  if (!data) return null;

  if (!data.hasStandards) {
    return (
      <div className="card p-4">
        <div className="font-semibold mb-2">Strength Level</div>
        <div className="text-sm text-ink-400">
          Chưa có standards cho <span className="text-white">{data.exercise.name}</span>.
          {data.best1RM && (
            <div className="mt-2">
              Best 1RM: <span className="text-white">{data.best1RM}kg</span> · Ratio{' '}
              {data.ratio}× BW
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentColor = LEVEL_COLORS[data.level] || '#c6ff3d';

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">Strength Level</div>
        <div className="text-xs text-ink-400">
          {data.assumedBodyweight
            ? 'BW assumed 70kg (log bodyweight)'
            : `BW ${data.bodyweight}kg · ${gender}`}
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <div
          className="text-3xl font-bold"
          style={{ color: currentColor }}
        >
          {data.levelLabel}
        </div>
        <div className="text-sm text-ink-400">
          {data.ratio}× BW · best {data.best1RM}kg
        </div>
      </div>

      {data.allLevels && (
        <div className="space-y-1.5">
          {data.allLevels.map((lvl) => {
            const isCurrent = lvl.level === data.level;
            return (
              <div
                key={lvl.level}
                className={`flex items-center gap-3 text-xs ${
                  isCurrent ? 'font-semibold' : 'text-ink-400'
                }`}
              >
                <div className="w-24 truncate">{lvl.label}</div>
                <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: lvl.achieved ? '100%' : '0%',
                      background: LEVEL_COLORS[lvl.level] || '#c6ff3d',
                    }}
                  />
                </div>
                <div className="w-20 text-right text-ink-400">
                  {fmtNumber(lvl.target1RM, 1)}kg
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data.nextLevel && (
        <div className="text-xs text-ink-400 pt-2 border-t border-ink-700">
          Next: <span className="text-white">{data.nextLevel.label}</span> at{' '}
          <span className="text-accent">{data.nextLevel.target1RM}kg</span> (
          {data.nextLevel.targetRatio}× BW)
        </div>
      )}
    </div>
  );
}