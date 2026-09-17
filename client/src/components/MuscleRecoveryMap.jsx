import { useMemo, useState } from 'react';
import { fmtNumber } from '../lib/format.js';
import { Info } from 'lucide-react';

const LABELS = {
  neck: 'Neck', traps: 'Traps',
  front_delt: 'Front Delt', side_delt: 'Side Delt', rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest', chest: 'Chest',
  lats: 'Lats', middle_back: 'Middle Back', lower_back: 'Lower Back',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  abs: 'Abs', obliques: 'Obliques',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
  cardio: 'Cardio',
};

function recoverySolid(percent, never) {
  if (never) return '#2a3040';
  if (percent >= 90) return '#c6ff3d';  // fresh
  if (percent >= 70) return '#ffb038';  // cooled
  if (percent >= 40) return '#ff8f3d';  // recovering
  if (percent >= 15) return '#ff5e5e';  // fatigued
  return '#8a1f1f';                     // cooked
}

function recoveryFill(percent, never) {
  if (never) return '#2a3040';
  if (percent >= 90) return 'url(#gradReady)';
  if (percent >= 70) return 'url(#gradAlmost)';
  if (percent >= 40) return 'url(#gradMid)';
  if (percent >= 15) return 'url(#gradFatigued)';
  return 'url(#gradDead)';
}

function fmtHours(h) {
  if (h == null) return '—';
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h}h`;
  return `${(h / 24).toFixed(1)}d`;
}

export default function MuscleRecoveryMap({ recovery = [] }) {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState('front');

  const byGroup = {};
  for (const r of recovery) byGroup[r.muscleGroup] = r;

  const get = (g) => byGroup[g] || {
    muscleGroup: g, percent: 100, sets7d: 0, sets30d: 0,
    volume7d: 0, volume30d: 0, hoursRemaining: null,
    hoursSince: null, lastTrainedAt: null, neverTrained: true,
    halfLife: 48, status: { label: 'Never trained', color: '#5a6470' },
  };

  const active = hovered || selected;
  const activeData = active ? get(active) : null;
  const activeNever = activeData?.neverTrained;

  const fillFor = (g) => {
    const r = get(g);
    const isActive = active === g;
    const dim = active && !isActive;
    return {
      fill: recoveryFill(r.percent, r.neverTrained),
      opacity: dim ? 0.35 : 1,
      filter: isActive ? 'url(#glowActive)' : undefined,
    };
  };

  const handlers = (g) => ({
    onMouseEnter: () => setHovered(g),
    onMouseLeave: () => setHovered(null),
    onClick: () => setSelected((s) => (s === g ? null : g)),
    style: { cursor: 'pointer', transition: 'opacity 220ms, filter 220ms', ...fillFor(g) },
  });

  const labelText = (g) => {
    const r = get(g);
    if (r.neverTrained) return '';
    return `${Math.round(r.percent)}`;
  };

  const groupsByStatus = useMemo(() => {
    const groups = recovery.filter((r) => r.muscleGroup !== 'cardio');
    return {
      fresh: groups.filter((g) => g.percent >= 90 && !g.neverTrained),
      cooled: groups.filter((g) => g.percent >= 70 && g.percent < 90),
      recovering: groups.filter((g) => g.percent >= 40 && g.percent < 70),
      fatigued: groups.filter((g) => g.percent >= 15 && g.percent < 40),
      cooked: groups.filter((g) => g.percent < 15 && !g.neverTrained),
      never: groups.filter((g) => g.neverTrained),
    };
  }, [recovery]);

  const nextReady = useMemo(() => {
    if (!groupsByStatus.recovering.length && !groupsByStatus.fatigued.length && !groupsByStatus.cooked.length)
      return null;
    const all = [
      ...groupsByStatus.recovering,
      ...groupsByStatus.fatigued,
      ...groupsByStatus.cooked,
    ];
    return all.sort((a, b) => (a.hoursRemaining || 99) - (b.hoursRemaining || 99))[0];
  }, [groupsByStatus]);

  return (
    <div className="card p-4 sm:p-6 space-y-5 overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold text-lg">Muscle Recovery</div>
          <div className="text-xs text-ink-400 mt-0.5">
            {groupsByStatus.fresh.length} fresh ·{' '}
            {groupsByStatus.recovering.length + groupsByStatus.cooled.length} recovering ·{' '}
            {groupsByStatus.fatigued.length + groupsByStatus.cooked.length} fatigued
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-ink-400 flex-wrap">
          {[
            { color: '#8a1f1f', label: 'Cooked' },
            { color: '#ff5e5e', label: 'Fatigued' },
            { color: '#ff8f3d', label: 'Recovering' },
            { color: '#ffb038', label: 'Cooled' },
            { color: '#c6ff3d', label: 'Fresh' },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: l.color, boxShadow: `0 0 6px ${l.color}88` }}
              />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Body panel */}
        <div className="flex flex-col items-center gap-3 mx-auto lg:mx-0">
          <div className="flex items-center gap-2 bg-ink-850 rounded-full p-1 border border-ink-700">
            {['front', 'side', 'back'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  view === v
                    ? 'bg-accent text-ink-950 font-semibold'
                    : 'text-ink-400 hover:text-white'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="relative">
            <div
              className="absolute inset-0 blur-3xl opacity-25 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at 50% 40%, rgba(198,255,61,0.35), transparent 60%)',
              }}
            />
            <svg viewBox="0 0 200 400" width="240" height="480"
              className="relative shrink-0 select-none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gradDead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b32d2d" />
                  <stop offset="100%" stopColor="#5c0e0e" />
                </linearGradient>
                <linearGradient id="gradFatigued" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff7272" />
                  <stop offset="100%" stopColor="#c93a3a" />
                </linearGradient>
                <linearGradient id="gradMid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffa05c" />
                  <stop offset="100%" stopColor="#e07a30" />
                </linearGradient>
                <linearGradient id="gradAlmost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffd066" />
                  <stop offset="100%" stopColor="#ffa500" />
                </linearGradient>
                <linearGradient id="gradReady" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dcff70" />
                  <stop offset="100%" stopColor="#9bd82f" />
                </linearGradient>
                <filter id="glowActive" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <style>{`
                  .body-outline { fill: #232a36; stroke: #4a5262; stroke-width: 1.5; }
                  .muscle-label { font-size: 7px; fill: #0b0c0e; font-weight: 800; text-anchor: middle; pointer-events: none; }
                  .muscle { transition: opacity 220ms ease, filter 220ms ease; }
                `}</style>
              </defs>

              <BodyBase view={view} />
              {view === 'front' && <FrontView handlers={handlers} labelText={labelText} />}
              {view === 'side' && <SideView handlers={handlers} labelText={labelText} />}
              {view === 'back' && <BackView handlers={handlers} labelText={labelText} />}

              <text x="100" y="385" textAnchor="middle" fontSize="9" fontWeight="700"
                fill="#8a93a0" letterSpacing="2">
                {view.toUpperCase()}
              </text>
            </svg>
          </div>

          {nextReady && (
            <div className="text-[11px] text-ink-400 text-center max-w-[240px]">
              Next ready:{' '}
              <span className="text-accent">{LABELS[nextReady.muscleGroup]}</span>{' '}
              in {fmtHours(nextReady.hoursRemaining)}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="space-y-4 min-w-0">
          <div
            className="border rounded-xl p-4 transition-all duration-200 relative overflow-hidden"
            style={{
              borderColor: active
                ? recoverySolid(activeData?.percent || 0, activeNever) + '66'
                : '#262c35',
              background: active
                ? `linear-gradient(135deg, ${recoverySolid(activeData?.percent || 0, activeNever)}11, transparent 60%)`
                : 'transparent',
            }}
          >
            {active && activeData ? (
              <>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-lg">{LABELS[active] || active}</div>
                    <div className="text-xs text-ink-400">
                      {activeNever ? 'Never trained' : `Last: ${fmtHours(activeData.hoursSince)} ago`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-3xl font-bold tabular-nums"
                      style={{ color: recoverySolid(activeData.percent, activeNever) }}
                    >
                      {activeNever ? '—' : `${Math.round(activeData.percent)}%`}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide" style={{ color: activeData.status?.color }}>
                      {activeData.status?.label || '—'}
                    </div>
                  </div>
                </div>

                <div className="h-2.5 bg-ink-800 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${activeNever ? 0 : activeData.percent}%`,
                      background: `linear-gradient(90deg, ${recoverySolid(activeData.percent, activeNever)}aa, ${recoverySolid(activeData.percent, activeNever)})`,
                      boxShadow: `0 0 12px ${recoverySolid(activeData.percent, activeNever)}66`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Half-life" value={fmtHours(activeData.halfLife || 48)} />
                  <Stat label="Hours since" value={activeData.hoursSince != null ? fmtHours(activeData.hoursSince) : '—'} />
                  <Stat label="Sets 7d" value={activeData.sets7d} />
                  <Stat label="Sets 30d" value={activeData.sets30d} />
                  <Stat label="Volume 7d" value={`${fmtNumber((activeData.volume7d || 0) / 1000, 1)}t`} />
                  <Stat label="Volume 30d" value={`${fmtNumber((activeData.volume30d || 0) / 1000, 1)}t`} />
                </div>

                {!activeNever && activeData.percent < 90 && (
                  <div className="mt-3 text-xs flex items-center gap-2 text-ink-400">
                    <Info className="w-3 h-3" />
                    Fresh in{' '}
                    <span className="text-white font-medium">{fmtHours(activeData.hoursRemaining)}</span>
                  </div>
                )}
                {!activeNever && activeData.percent >= 90 && (
                  <div className="mt-3 text-xs flex items-center gap-2 text-accent">
                    <Info className="w-3 h-3" /> Fresh — ready to train
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 text-ink-400 text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>Hover hoặc chạm một vùng cơ trên hình để xem chi tiết</span>
              </div>
            )}
          </div>

          {['cooked', 'fatigued', 'recovering', 'cooled', 'fresh', 'never'].map((key) => {
            const items = groupsByStatus[key];
            if (!items?.length) return null;
            const colors = {
              cooked: '#8a1f1f',
              fatigued: '#ff5e5e',
              recovering: '#ff8f3d',
              cooled: '#ffb038',
              fresh: '#c6ff3d',
              never: '#5a6470',
            };
            const titles = {
              cooked: 'Cooked',
              fatigued: 'Fatigued',
              recovering: 'Recovering',
              cooled: 'Cooled',
              fresh: 'Fresh',
              never: 'Never trained',
            };
            return (
              <StatusGroup
                key={key}
                title={titles[key]}
                color={colors[key]}
                items={items}
                active={active}
                setHovered={setHovered}
                setSelected={setSelected}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-ink-400">{label}</div>
      <div className="font-semibold text-sm mt-0.5">{value ?? 0}</div>
    </div>
  );
}

function StatusGroup({ title, color, items, active, setHovered, setSelected }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        <span className="text-xs uppercase tracking-wide text-ink-400">
          {title} · {items.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((r) => {
          const isActive = active === r.muscleGroup;
          return (
            <button
              key={r.muscleGroup}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                isActive ? 'border-accent bg-accent/10 text-white' : 'border-ink-700 hover:border-ink-500 text-ink-300'
              }`}
              onMouseEnter={() => setHovered(r.muscleGroup)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected((s) => (s === r.muscleGroup ? null : r.muscleGroup))}
            >
              <span className="font-medium">{LABELS[r.muscleGroup]}</span>
              <span className="ml-1.5 opacity-60">{Math.round(r.percent)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// === SVG components ===
function BodyBase({ view }) {
  if (view === 'side') {
    return (
      <g className="body-outline">
        <ellipse cx="100" cy="28" rx="16" ry="20" />
        <rect x="92" y="46" width="16" height="12" rx="3" />
        <path d="M 86 58 Q 76 62 74 80 L 72 130 Q 70 160 76 175 L 124 175 Q 130 160 128 130 L 126 80 Q 124 62 114 58 Z" />
        <path d="M 76 66 Q 68 70 68 86 L 72 130 Q 76 132 80 126 L 82 80 Q 82 68 78 66 Z" />
        <path d="M 84 178 L 116 178 L 112 250 L 120 320 Q 116 330 108 328 L 100 260 L 92 328 Q 84 330 80 320 L 88 250 Z" />
      </g>
    );
  }
  return (
    <g className="body-outline">
      <ellipse cx="100" cy="30" rx="18" ry="22" />
      <rect x="92" y="50" width="16" height="14" rx="3" />
      <path d="M 78 66 Q 68 68 66 88 L 66 175 Q 66 195 78 200 L 122 200 Q 134 195 134 175 L 134 88 Q 132 68 122 66 Z" />
      <path d="M 62 80 Q 52 86 52 100 L 56 170 Q 60 178 68 176 L 70 96 Q 70 84 64 80 Z" />
      <path d="M 138 80 Q 148 86 148 100 L 144 170 Q 140 178 132 176 L 130 96 Q 130 84 136 80 Z" />
      <path d="M 78 202 L 98 202 L 96 290 L 82 290 Z" />
      <path d="M 102 202 L 122 202 L 118 290 L 104 290 Z" />
      <path d="M 82 292 L 96 292 L 96 315 Q 88 322 80 315 Z" />
      <path d="M 104 292 L 118 292 L 120 315 Q 112 322 104 315 Z" />
    </g>
  );
}

function FrontView({ handlers, labelText }) {
  return (
    <g>
      <rect x="94" y="50" width="12" height="14" rx="2" className="muscle" {...handlers('neck')} />
      <path d="M 82 66 Q 92 62 100 62 Q 108 62 118 66 L 116 78 Q 108 76 100 76 Q 92 76 84 78 Z"
        className="muscle" {...handlers('traps')} />
      <ellipse cx="76" cy="82" rx="10" ry="12" className="muscle" {...handlers('front_delt')} />
      <ellipse cx="124" cy="82" rx="10" ry="12" className="muscle" {...handlers('front_delt')} />
      <path d="M 68 76 Q 62 80 62 92 Q 62 100 68 102 L 70 88 Z" className="muscle" {...handlers('side_delt')} />
      <path d="M 132 76 Q 138 80 138 92 Q 138 100 132 102 L 130 88 Z" className="muscle" {...handlers('side_delt')} />
      <path d="M 84 78 Q 92 76 100 76 Q 108 76 116 78 L 114 96 Q 108 100 100 100 Q 92 100 86 96 Z"
        className="muscle" {...handlers('upper_chest')} />
      <path d="M 86 98 L 114 98 L 112 120 Q 106 126 100 126 Q 94 126 88 120 Z"
        className="muscle" {...handlers('chest')} />
      <text className="muscle-label" x="100" y="114">{labelText('chest')}</text>
      <ellipse cx="62" cy="130" rx="8" ry="18" className="muscle" {...handlers('biceps')} />
      <ellipse cx="138" cy="130" rx="8" ry="18" className="muscle" {...handlers('biceps')} />
      <text className="muscle-label" x="62" y="134">{labelText('biceps')}</text>
      <ellipse cx="58" cy="168" rx="7" ry="20" className="muscle" {...handlers('forearms')} />
      <ellipse cx="142" cy="168" rx="7" ry="20" className="muscle" {...handlers('forearms')} />
      <rect x="88" y="130" width="24" height="42" rx="3" className="muscle" {...handlers('abs')} />
      <text className="muscle-label" x="100" y="154">{labelText('abs')}</text>
      <path d="M 84 130 L 84 172 L 78 168 L 78 132 Z" className="muscle" {...handlers('obliques')} />
      <path d="M 116 130 L 116 172 L 122 168 L 122 132 Z" className="muscle" {...handlers('obliques')} />
      <path d="M 82 202 L 96 202 L 94 262 L 84 262 Z" className="muscle" {...handlers('quads')} />
      <path d="M 104 202 L 118 202 L 116 262 L 106 262 Z" className="muscle" {...handlers('quads')} />
      <text className="muscle-label" x="100" y="235">{labelText('quads')}</text>
      <path d="M 84 265 L 94 265 L 94 300 L 84 300 Z" className="muscle" {...handlers('calves')} />
      <path d="M 106 265 L 116 265 L 116 300 L 106 300 Z" className="muscle" {...handlers('calves')} />
      <text className="muscle-label" x="100" y="285">{labelText('calves')}</text>
    </g>
  );
}

function SideView({ handlers, labelText }) {
  return (
    <g>
      <rect x="92" y="50" width="16" height="14" rx="2" className="muscle" {...handlers('neck')} />
      <path d="M 88 66 Q 96 62 100 62 L 112 70 L 108 84 Q 100 80 92 82 Z"
        className="muscle" {...handlers('traps')} />
      <ellipse cx="82" cy="88" rx="9" ry="11" className="muscle" {...handlers('front_delt')} />
      <ellipse cx="90" cy="84" rx="8" ry="10" className="muscle" {...handlers('side_delt')} />
      <text className="muscle-label" x="92" y="80">{labelText('side_delt')}</text>
      <ellipse cx="98" cy="90" rx="7" ry="9" className="muscle" {...handlers('rear_delt')} />
      <path d="M 74 96 Q 84 92 92 98 L 90 118 Q 82 122 76 118 Z"
        className="muscle" {...handlers('chest')} />
      <path d="M 92 98 Q 104 104 108 120 L 104 138 L 96 136 Q 94 118 92 108 Z"
        className="muscle" {...handlers('lats')} />
      <text className="muscle-label" x="102" y="122">{labelText('lats')}</text>
      <ellipse cx="76" cy="118" rx="7" ry="16" className="muscle" {...handlers('biceps')} />
      <ellipse cx="94" cy="122" rx="7" ry="16" className="muscle" {...handlers('triceps')} />
      <ellipse cx="76" cy="150" rx="6" ry="16" className="muscle" {...handlers('forearms')} />
      <path d="M 84 122 L 96 122 L 94 156 L 86 156 Z"
        className="muscle" {...handlers('abs')} />
      <path d="M 96 138 L 110 140 L 108 168 L 96 166 Z"
        className="muscle" {...handlers('lower_back')} />
      <path d="M 96 178 Q 116 174 122 186 Q 122 200 106 204 L 92 202 Z"
        className="muscle" {...handlers('glutes')} />
      <text className="muscle-label" x="108" y="192">{labelText('glutes')}</text>
      <path d="M 84 206 L 100 206 L 98 262 L 86 262 Z"
        className="muscle" {...handlers('quads')} />
      <path d="M 100 206 L 116 206 L 114 262 L 104 262 Z"
        className="muscle" {...handlers('hamstrings')} />
      <path d="M 88 268 L 116 268 L 114 302 L 90 302 Z"
        className="muscle" {...handlers('calves')} />
    </g>
  );
}

function BackView({ handlers, labelText }) {
  return (
    <g>
      <rect x="94" y="50" width="12" height="14" rx="2" className="muscle" {...handlers('neck')} />
      <path d="M 82 66 Q 100 58 118 66 L 114 88 Q 108 84 100 84 Q 92 84 86 88 Z"
        className="muscle" {...handlers('traps')} />
      <text className="muscle-label" x="100" y="78">{labelText('traps')}</text>
      <ellipse cx="74" cy="96" rx="10" ry="10" className="muscle" {...handlers('rear_delt')} />
      <ellipse cx="126" cy="96" rx="10" ry="10" className="muscle" {...handlers('rear_delt')} />
      <path d="M 82 92 Q 76 108 80 138 L 96 138 L 98 96 Q 90 92 82 92 Z"
        className="muscle" {...handlers('lats')} />
      <path d="M 118 92 Q 124 108 120 138 L 104 138 L 102 96 Q 110 92 118 92 Z"
        className="muscle" {...handlers('lats')} />
      <rect x="94" y="88" width="12" height="52" rx="2" className="muscle" {...handlers('middle_back')} />
      <text className="muscle-label" x="100" y="118">{labelText('middle_back')}</text>
      <rect x="94" y="142" width="12" height="30" rx="2" className="muscle" {...handlers('lower_back')} />
      <ellipse cx="58" cy="132" rx="8" ry="20" className="muscle" {...handlers('triceps')} />
      <ellipse cx="142" cy="132" rx="8" ry="20" className="muscle" {...handlers('triceps')} />
      <text className="muscle-label" x="58" y="136">{labelText('triceps')}</text>
      <ellipse cx="56" cy="172" rx="7" ry="18" className="muscle" {...handlers('forearms')} />
      <path d="M 80 178 Q 100 172 120 178 Q 122 200 100 204 Q 78 200 80 178 Z"
        className="muscle" {...handlers('glutes')} />
      <path d="M 82 208 L 96 208 L 94 262 L 84 262 Z" className="muscle" {...handlers('hamstrings')} />
      <path d="M 104 208 L 118 208 L 116 262 L 106 262 Z" className="muscle" {...handlers('hamstrings')} />
      <text className="muscle-label" x="100" y="238">{labelText('hamstrings')}</text>
      <path d="M 84 268 L 94 268 L 94 302 L 84 302 Z" className="muscle" {...handlers('calves')} />
      <path d="M 106 268 L 116 268 L 116 302 L 106 302 Z" className="muscle" {...handlers('calves')} />
    </g>
  );
}
