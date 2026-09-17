import { useState } from 'react';
import { fmtNumber } from '../lib/format.js';

const LABELS = {
  neck: 'Neck',
  traps: 'Traps',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest',
  chest: 'Chest',
  lats: 'Lats',
  middle_back: 'Middle Back',
  lower_back: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
};

function recoveryColor(percent, never) {
  if (never) return '#3a424f';
  if (percent >= 95) return '#c6ff3d';
  if (percent >= 75) return '#ffb038';
  if (percent >= 50) return '#ff8f3d';
  if (percent >= 25) return '#ff5e5e';
  return '#8a1f1f';
}

function recoveryStroke(percent, never) {
  if (never) return '#5a6470';
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
  return `${(h / 24).toFixed(1)}d`;
}

function pctLabel(percent, never) {
  return never ? '—' : `${percent}%`;
}

export default function MuscleRecoveryMap({ recovery = [] }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const byGroup = {};
  for (const r of recovery) byGroup[r.muscleGroup] = r;

  const get = (g) => byGroup[g] || {
    muscleGroup: g, percent: 100, sets7d: 0, sets30d: 0,
    volume7d: 0, volume30d: 0, hoursRemaining: null, lastTrainedAt: null,
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

  const strokeFor = (g) => recoveryStroke(get(g).percent, !get(g).lastTrainedAt);

  const handlers = (g) => ({
    onMouseEnter: () => setHovered(g),
    onMouseLeave: () => setHovered(null),
    onClick: () => setSelected((s) => (s === g ? null : g)),
    style: { cursor: 'pointer', transition: 'fill 200ms, opacity 200ms' },
  });

  const labelText = (g) => pctLabel(get(g).percent, !get(g).lastTrainedAt);

  const allGroups = [
    'neck', 'traps',
    'front_delt', 'side_delt', 'rear_delt',
    'upper_chest', 'chest',
    'lats', 'middle_back', 'lower_back',
    'biceps', 'triceps', 'forearms',
    'abs', 'obliques',
    'glutes', 'quads', 'hamstrings', 'calves',
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
        {/* SVG bodies */}
        <div className="flex justify-center gap-3 flex-wrap">
          {/* FRONT */}
          <svg viewBox="0 0 140 320" width="180" height="400" className="shrink-0">
            <defs>
              <style>{`.lb { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            {/* Head */}
            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="70" cy="20" r="12" />
            </g>

            {/* Neck */}
            <rect x="63" y="30" width="14" height="10" rx="2"
              fill={fillFor('neck')} stroke={strokeFor('neck')} strokeWidth="1"
              {...handlers('neck')} />
            <text className="lb" x="70" y="38">{labelText('neck')}</text>

            {/* Front delts (2 bên) */}
            <path d="M 48 42 Q 38 44 36 54 L 40 66 Q 48 62 56 62 L 56 44 Q 52 42 48 42 Z"
              fill={fillFor('front_delt')} stroke={strokeFor('front_delt')} strokeWidth="1"
              {...handlers('front_delt')} />
            <path d="M 92 42 Q 102 44 104 54 L 100 66 Q 92 62 84 62 L 84 44 Q 88 42 92 42 Z"
              fill={fillFor('front_delt')} stroke={strokeFor('front_delt')} strokeWidth="1"
              {...handlers('front_delt')} />
            <text className="lb" x="46" y="56">{labelText('front_delt')}</text>

            {/* Upper chest */}
            <path d="M 52 64 Q 60 62 70 62 Q 80 62 88 64 L 86 78 L 70 80 L 54 78 Z"
              fill={fillFor('upper_chest')} stroke={strokeFor('upper_chest')} strokeWidth="1"
              {...handlers('upper_chest')} />
            <text className="lb" x="70" y="74">{labelText('upper_chest')}</text>

            {/* Mid/lower chest */}
            <path d="M 54 80 L 86 80 L 84 96 Q 78 102 70 102 Q 62 102 56 96 Z"
              fill={fillFor('chest')} stroke={strokeFor('chest')} strokeWidth="1"
              {...handlers('chest')} />
            <text className="lb" x="70" y="94">{labelText('chest')}</text>

            {/* Biceps L */}
            <path d="M 32 68 Q 26 72 26 84 L 28 104 Q 34 104 36 94 L 36 70 Q 34 68 32 68 Z"
              fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth="1"
              {...handlers('biceps')} />
            {/* Biceps R */}
            <path d="M 108 68 Q 114 72 114 84 L 112 104 Q 106 104 104 94 L 104 70 Q 106 68 108 68 Z"
              fill={fillFor('biceps')} stroke={strokeFor('biceps')} strokeWidth="1"
              {...handlers('biceps')} />
            <text className="lb" x="30" y="88">{labelText('biceps')}</text>

            {/* Forearms L/R */}
            <path d="M 28 108 L 36 108 L 34 130 L 30 130 Z"
              fill={fillFor('forearms')} stroke={strokeFor('forearms')} strokeWidth="1"
              {...handlers('forearms')} />
            <path d="M 104 108 L 112 108 L 110 130 L 106 130 Z"
              fill={fillFor('forearms')} stroke={strokeFor('forearms')} strokeWidth="1"
              {...handlers('forearms')} />
            <text className="lb" x="32" y="122">{labelText('forearms')}</text>

            {/* Abs */}
            <rect x="58" y="104" width="24" height="40" rx="2"
              fill={fillFor('abs')} stroke={strokeFor('abs')} strokeWidth="1"
              {...handlers('abs')} />
            <text className="lb" x="70" y="128">{labelText('abs')}</text>

            {/* Obliques (2 bên) */}
            <path d="M 56 106 L 56 140 L 50 138 L 50 108 Z"
              fill={fillFor('obliques')} stroke={strokeFor('obliques')} strokeWidth="1"
              {...handlers('obliques')} />
            <path d="M 84 106 L 84 140 L 90 138 L 90 108 Z"
              fill={fillFor('obliques')} stroke={strokeFor('obliques')} strokeWidth="1"
              {...handlers('obliques')} />

            {/* Quads */}
            <path d="M 54 146 L 68 146 L 66 210 L 56 210 Z"
              fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth="1"
              {...handlers('quads')} />
            <path d="M 72 146 L 86 146 L 84 210 L 74 210 Z"
              fill={fillFor('quads')} stroke={strokeFor('quads')} strokeWidth="1"
              {...handlers('quads')} />
            <text className="lb" x="70" y="180">{labelText('quads')}</text>

            {/* Calves front (tibialis) */}
            <path d="M 58 218 L 66 218 L 66 250 L 58 250 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <path d="M 74 218 L 82 218 L 82 250 L 74 250 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <text className="lb" x="70" y="238">{labelText('calves')}</text>

            <text x="70" y="272" textAnchor="middle" fontSize="7" fill="#8a93a0">FRONT</text>
          </svg>

          {/* BACK */}
          <svg viewBox="0 0 140 320" width="180" height="400" className="shrink-0">
            <defs>
              <style>{`.lb2 { font-size: 6px; fill: #0b0c0e; font-weight: 700; text-anchor: middle; pointer-events: none; }`}</style>
            </defs>

            <g stroke="#262c35" strokeWidth="0.8" fill="none">
              <circle cx="70" cy="20" r="12" />
            </g>

            {/* Neck back */}
            <rect x="63" y="30" width="14" height="10" rx="2"
              fill={fillFor('neck')} stroke={strokeFor('neck')} strokeWidth="1"
              {...handlers('neck')} />
            <text className="lb2" x="70" y="38">{labelText('neck')}</text>

            {/* Traps */}
            <path d="M 48 42 L 92 42 L 90 66 Q 80 72 70 72 Q 60 72 50 66 Z"
              fill={fillFor('traps')} stroke={strokeFor('traps')} strokeWidth="1"
              {...handlers('traps')} />
            <text className="lb2" x="70" y="58">{labelText('traps')}</text>

            {/* Rear delts */}
            <path d="M 46 68 Q 36 70 34 80 L 38 92 Q 44 90 50 84 L 50 68 Z"
              fill={fillFor('rear_delt')} stroke={strokeFor('rear_delt')} strokeWidth="1"
              {...handlers('rear_delt')} />
            <path d="M 94 68 Q 104 70 106 80 L 102 92 Q 96 90 90 84 L 90 68 Z"
              fill={fillFor('rear_delt')} stroke={strokeFor('rear_delt')} strokeWidth="1"
              {...handlers('rear_delt')} />

            {/* Lats (2 bên) */}
            <path d="M 46 74 Q 44 92 48 108 L 62 110 L 62 76 Q 54 74 46 74 Z"
              fill={fillFor('lats')} stroke={strokeFor('lats')} strokeWidth="1"
              {...handlers('lats')} />
            <path d="M 94 74 Q 96 92 92 108 L 78 110 L 78 76 Q 86 74 94 74 Z"
              fill={fillFor('lats')} stroke={strokeFor('lats')} strokeWidth="1"
              {...handlers('lats')} />
            <text className="lb2" x="55" y="94">{labelText('lats')}</text>

            {/* Middle back */}
            <path d="M 62 76 L 78 76 L 78 106 L 62 106 Z"
              fill={fillFor('middle_back')} stroke={strokeFor('middle_back')} strokeWidth="1"
              {...handlers('middle_back')} />
            <text className="lb2" x="70" y="94">{labelText('middle_back')}</text>

            {/* Lower back */}
            <path d="M 62 108 L 78 108 L 78 138 L 62 138 Z"
              fill={fillFor('lower_back')} stroke={strokeFor('lower_back')} strokeWidth="1"
              {...handlers('lower_back')} />
            <text className="lb2" x="70" y="126">{labelText('lower_back')}</text>

            {/* Triceps L/R */}
            <path d="M 32 74 Q 26 78 26 90 L 28 106 Q 34 106 36 96 L 36 74 Z"
              fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth="1"
              {...handlers('triceps')} />
            <path d="M 108 74 Q 114 78 114 90 L 112 106 Q 106 106 104 96 L 104 74 Z"
              fill={fillFor('triceps')} stroke={strokeFor('triceps')} strokeWidth="1"
              {...handlers('triceps')} />
            <text className="lb2" x="30" y="92">{labelText('triceps')}</text>

            {/* Glutes */}
            <path d="M 54 146 Q 70 142 86 146 L 86 172 Q 70 178 54 172 Z"
              fill={fillFor('glutes')} stroke={strokeFor('glutes')} strokeWidth="1"
              {...handlers('glutes')} />
            <text className="lb2" x="70" y="164">{labelText('glutes')}</text>

            {/* Hamstrings */}
            <path d="M 54 176 L 68 176 L 66 218 L 56 218 Z"
              fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth="1"
              {...handlers('hamstrings')} />
            <path d="M 72 176 L 86 176 L 84 218 L 74 218 Z"
              fill={fillFor('hamstrings')} stroke={strokeFor('hamstrings')} strokeWidth="1"
              {...handlers('hamstrings')} />
            <text className="lb2" x="70" y="200">{labelText('hamstrings')}</text>

            {/* Calves back */}
            <path d="M 58 224 L 66 224 L 66 256 L 58 256 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <path d="M 74 224 L 82 224 L 82 256 L 74 256 Z"
              fill={fillFor('calves')} stroke={strokeFor('calves')} strokeWidth="1"
              {...handlers('calves')} />
            <text className="lb2" x="70" y="244">{labelText('calves')}</text>

            <text x="70" y="272" textAnchor="middle" fontSize="7" fill="#8a93a0">BACK</text>
          </svg>
        </div>

        {/* Detail panel */}
        <div className="space-y-3 min-w-0">
          {active && activeData ? (
            <div className="border border-ink-700 rounded-lg p-3 space-y-2 bg-ink-850">
              <div className="flex items-center justify-between">
                <div className="font-medium">{LABELS[active] || active}</div>
                <div className="text-sm font-semibold"
                  style={{ color: recoveryColor(activeData.percent, activeNever) }}>
                  {activeNever ? 'Never trained' : `${activeData.percent}% recovered`}
                </div>
              </div>
              <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${activeNever ? 0 : activeData.percent}%`,
                    background: recoveryColor(activeData.percent, activeNever),
                  }} />
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
                  <span>{fmtNumber((activeData.volume7d || 0) / 1000, 1)}t</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-400">Vol 30d</span>
                  <span>{fmtNumber((activeData.volume30d || 0) / 1000, 1)}t</span>
                </div>
                {!activeNever && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-ink-400">Last</span>
                      <span>{activeData.hoursSince != null ? `${fmtHours(activeData.hoursSince)} ago` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">ETA</span>
                      <span>{activeData.percent >= 100 ? 'Ready' : fmtHours(activeData.hoursRemaining)}</span>
                    </div>
                  </>
                )}
              </div>
              {selected && (
                <button className="btn btn-ghost w-full text-xs justify-center" onClick={() => setSelected(null)}>
                  Close
                </button>
              )}
            </div>
          ) : (
            <div className="border border-ink-700 rounded-lg p-3 text-sm text-ink-400">
              Hover hoặc click vào vùng cơ trên hình để xem chi tiết.
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allGroups.map((g) => {
              const r = get(g);
              const never = !r.lastTrainedAt;
              return (
                <button
                  key={g}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                    active === g ? 'border-accent' : 'border-ink-700 hover:border-ink-500'
                  }`}
                  onMouseEnter={() => setHovered(g)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => setSelected((s) => (s === g ? null : g))}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: recoveryColor(r.percent, never) }} />
                    <span className="truncate">{LABELS[g] || g}</span>
                  </div>
                  <span className="font-medium shrink-0 ml-2"
                    style={{ color: recoveryColor(r.percent, never) }}>
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
