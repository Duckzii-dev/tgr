import { useState } from 'react';
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

function recoveryColor(percent, neverTrained) {
  if (neverTrained) return '#3a424f';
  if (percent >= 95) return '#c6ff3d';
  if (percent >= 75) return '#ffb038';
  if (percent >= 50) return '#ff8f3d';
  if (percent >= 25) return '#ff5e5e';
  return '#8a1f1f';
}

function recoveryStroke(percent, neverTrained) {
  if (neverTrained) return '#5a6470';
  if (percent >= 95) return '#9bd82f';
  if (percent >= 75) return '#d99230';
  if (percent >= 50) return '#d97830';
  if (percent >= 25) return '#d94e4e';
  return '#6a1515';
}

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  const d = h / 24;
  return `${d.toFixed(1)}d`;
}

function pctLabel(percent, neverTrained) {
  if (neverTrained) return '—';
  return `${percent}%`;
}

export default function MuscleRecoveryMap({ recovery = [] }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const byGroup = {};
  for (const r of recovery) byGroup[r.muscleGroup] = r;

  const get = (g) =>
    byGroup[g] || {
      muscleGroup: g,
      percent: 100,
      sets7d: 0,
      sets30d: 0,
      volume7d: 0,
      volume30d: 0,
      hoursRemaining: null,
      lastTrainedAt: null,
    };

  const active = hovered || selected;
  const activeData = active ? get(active) : null;
  const activeNever = activeData ? !activeData.lastTrainedAt : false;

  const fillFor = (g) => {
    const r = get(g);
    const never = !r.lastTrainedAt;
    const base = recoveryColor(r.percent, never);
    if (active === g) return base;
    if (active && active !== g) return `${base}55`;
    return base;
  };

  const strokeFor = (g) => {
    const r = get(g);
    const never = !r.lastTrainedAt;
    return recoveryStroke(r.percent, never);
  };

  const handlers = (g) => ({
    onMouseEnter: () => setHovered(g),
    onMouseLeave: () => setHovered(null),
    onClick: () => setSelected((s) => (s === g ? null : g)),
    style: { cursor: 'pointer', transition: 'fill 200ms, opacity 200ms' },
  });

  const groupsOrder = [
    'chest',
    'back',
    'shoulders',
    'biceps',
    'triceps',
    'legs',
    'core',
    'cardio',
  ];

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

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* === SVG Body === */}
        <div className="flex justify-center gap-3">
          {/* Front view */}
          <svg
            viewBox="0 0 120 260"
            width="180"
            height="380"
            className="shrink-0"
          >
            <defs>
              <style>{`.bodyLabel { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            {/* Outline body (static) */}
            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="60" cy="18" r="10" />
              <rect x="52" y="28" width="16" height="6" rx="2" />
            </g>

            {/* Shoulders (front + back) */}
            <path
              d="M 40 40 Q 30 42 28 50 L 32 66 Q 40 62 52 62 L 68 62 Q 80 62 88 66 L 92 50 Q 90 42 80 40 Z"
              fill={fillFor('shoulders')}
              stroke={strokeFor('shoulders')}
              strokeWidth="1"
              {...handlers('shoulders')}
            />
            <text className="bodyLabel" x="60" y="52">
              {pctLabel(
                get('shoulders').percent,
                !get('shoulders').lastTrainedAt
              )}
            </text>

            {/* Chest */}
            <path
              d="M 44 64 Q 50 62 60 62 Q 70 62 76 64 L 74 84 Q 68 88 60 88 Q 52 88 46 84 Z"
              fill={fillFor('chest')}
              stroke={strokeFor('chest')}
              strokeWidth="1"
              {...handlers('chest')}
            />
            <text className="bodyLabel" x="60" y="78">
              {pctLabel(get('chest').percent, !get('chest').lastTrainedAt)}
            </text>

            {/* Abs / Core */}
            <path
              d="M 48 90 L 72 90 L 70 118 L 50 118 Z"
              fill={fillFor('core')}
              stroke={strokeFor('core')}
              strokeWidth="1"
              {...handlers('core')}
            />
            <text className="bodyLabel" x="60" y="106">
              {pctLabel(get('core').percent, !get('core').lastTrainedAt)}
            </text>

            {/* Biceps left */}
            <path
              d="M 24 68 Q 20 72 20 82 L 24 102 Q 30 100 32 92 L 32 70 Q 28 68 24 68 Z"
              fill={fillFor('biceps')}
              stroke={strokeFor('biceps')}
              strokeWidth="1"
              {...handlers('biceps')}
            />
            {/* Biceps right */}
            <path
              d="M 96 68 Q 100 72 100 82 L 96 102 Q 90 100 88 92 L 88 70 Q 92 68 96 68 Z"
              fill={fillFor('biceps')}
              stroke={strokeFor('biceps')}
              strokeWidth="1"
              {...handlers('biceps')}
            />
            <text className="bodyLabel" x="26" y="88">
              {pctLabel(get('biceps').percent, !get('biceps').lastTrainedAt)}
            </text>

            {/* Legs (front: quads) */}
            <path
              d="M 46 122 L 58 122 L 56 178 L 48 178 Z"
              fill={fillFor('legs')}
              stroke={strokeFor('legs')}
              strokeWidth="1"
              {...handlers('legs')}
            />
            <path
              d="M 62 122 L 74 122 L 72 178 L 64 178 Z"
              fill={fillFor('legs')}
              stroke={strokeFor('legs')}
              strokeWidth="1"
              {...handlers('legs')}
            />
            <text className="bodyLabel" x="60" y="155">
              {pctLabel(get('legs').percent, !get('legs').lastTrainedAt)}
            </text>

            {/* Label */}
            <text
              x="60"
              y="200"
              textAnchor="middle"
              fontSize="7"
              fill="#8a93a0"
            >
              FRONT
            </text>
          </svg>

          {/* Back view */}
          <svg
            viewBox="0 0 120 260"
            width="180"
            height="380"
            className="shrink-0"
          >
            <defs>
              <style>{`.bodyLabelB { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            {/* Head + neck */}
            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="60" cy="18" r="10" />
              <rect x="52" y="28" width="16" height="6" rx="2" />
            </g>

            {/* Back (traps + lats) */}
            <path
              d="M 40 40 Q 30 42 28 50 L 34 70 L 44 66 Q 52 62 60 62 Q 68 62 76 66 L 86 70 L 92 50 Q 90 42 80 40 Z"
              fill={fillFor('back')}
              stroke={strokeFor('back')}
              strokeWidth="1"
              {...handlers('back')}
            />
            <text className="bodyLabelB" x="60" y="55">
              {pctLabel(get('back').percent, !get('back').lastTrainedAt)}
            </text>

            {/* Triceps left */}
            <path
              d="M 24 68 Q 20 72 20 82 L 24 102 Q 30 100 32 92 L 32 70 Q 28 68 24 68 Z"
              fill={fillFor('triceps')}
              stroke={strokeFor('triceps')}
              strokeWidth="1"
              {...handlers('triceps')}
            />
            {/* Triceps right */}
            <path
              d="M 96 68 Q 100 72 100 82 L 96 102 Q 90 100 88 92 L 88 70 Q 92 68 96 68 Z"
              fill={fillFor('triceps')}
              stroke={strokeFor('triceps')}
              strokeWidth="1"
              {...handlers('triceps')}
            />
            <text className="bodyLabelB" x="26" y="88">
              {pctLabel(get('triceps').percent, !get('triceps').lastTrainedAt)}
            </text>

            {/* Lower back / core */}
            <path
              d="M 50 88 L 70 88 L 68 118 L 52 118 Z"
              fill={fillFor('core')}
              stroke={strokeFor('core')}
              strokeWidth="1"
              {...handlers('core')}
            />

            {/* Glutes + hamstrings = legs (back) */}
            <path
              d="M 46 122 L 74 122 L 72 178 L 64 178 L 60 150 L 56 178 L 48 178 Z"
              fill={fillFor('legs')}
              stroke={strokeFor('legs')}
              strokeWidth="1"
              {...handlers('legs')}
            />
            <text className="bodyLabelB" x="60" y="152">
              {pctLabel(get('legs').percent, !get('legs').lastTrainedAt)}
            </text>

            <text
              x="60"
              y="200"
              textAnchor="middle"
              fontSize="7"
              fill="#8a93a0"
            >
              BACK
            </text>
          </svg>
        </div>

        {/* === Detail panel === */}
        <div className="space-y-3 min-w-0">
          {active && activeData ? (
            <div className="border border-ink-700 rounded-lg p-3 space-y-2 bg-ink-850">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {MUSCLE_LABELS[active] || active}
                </div>
                <div
                  className="text-sm font-semibold"
                  style={{
                    color: recoveryColor(
                      activeData.percent,
                      activeNever
                    ),
                  }}
                >
                  {activeNever ? 'Never trained' : `${activeData.percent}% recovered`}
                </div>
              </div>

              <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${activeNever ? 0 : activeData.percent}%`,
                    background: recoveryColor(
                      activeData.percent,
                      activeNever
                    ),
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-400">Sets 7d</span>
                  <span>{activeData.sets7d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Sets 30d</span>
                  <span>{activeData.sets30d ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Vol 7d</span>
                  <span>
                    {fmtNumber((activeData.volume7d || 0) / 1000, 1)}t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Vol 30d</span>
                  <span>
                    {fmtNumber((activeData.volume30d || 0) / 1000, 1)}t
                  </span>
                </div>
                {!activeNever && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Last</span>
                      <span>
                        {activeData.hoursSince != null
                          ? `${fmtHours(activeData.hoursSince)} ago`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">ETA</span>
                      <span>
                        {activeData.percent >= 100
                          ? 'Ready'
                          : fmtHours(activeData.hoursRemaining)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {selected && (
                <button
                  className="btn btn-ghost w-full text-xs justify-center"
                  onClick={() => setSelected(null)}
                >
                  Close
                </button>
              )}
            </div>
          ) : (
            <div className="border border-ink-700 rounded-lg p-3 text-sm text-ink-400">
              Hover hoặc click một muscle group để xem chi tiết.
            </div>
          )}

          {/* Compact table */}
          <div className="grid grid-cols-2 gap-2">
            {groupsOrder.map((g) => {
              const r = get(g);
              const never = !r.lastTrainedAt;
              return (
                <button
                  key={g}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                    active === g
                      ? 'border-accent'
                      : 'border-ink-700 hover:border-ink-500'
                  }`}
                  onMouseEnter={() => setHovered(g)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected((s) => (s === g ? null : g))}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        background: recoveryColor(r.percent, never),
                      }}
                    />
                    <span className="truncate">
                      {MUSCLE_LABELS[g] || g}
                    </span>
                  </div>
                  <span
                    className="font-medium shrink-0 ml-2"
                    style={{
                      color: recoveryColor(r.percent, never),
                    }}
                  >
                    {pctLabel(r.percent, never)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
