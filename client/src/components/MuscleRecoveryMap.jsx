import { useMemo, useState, useRef, useEffect } from 'react';
import { fmtNumber } from '../lib/format.js';
import { Info, X } from 'lucide-react';
import { BODY_PATHS, getPathsForMuscle, getMusclesForView, VIEWBOX } from '../lib/bodyPaths.js';

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
  if (percent >= 90) return '#c6ff3d';
  if (percent >= 70) return '#ffb038';
  if (percent >= 40) return '#ff8f3d';
  if (percent >= 15) return '#ff5e5e';
  return '#8a1f1f';
}

function recoveryGradId(percent, never) {
  if (never) return 'gradNever';
  if (percent >= 90) return 'gradReady';
  if (percent >= 70) return 'gradAlmost';
  if (percent >= 40) return 'gradMid';
  if (percent >= 15) return 'gradFatigued';
  return 'gradDead';
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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
      fill: `url(#${recoveryGradId(r.percent, r.neverTrained)})`,
      opacity: dim ? 0.35 : 1,
      filter: isActive ? 'url(#glowActive)' : undefined,
    };
  };

  const handlers = (g) => ({
    onMouseEnter: () => setHovered(g),
    onMouseLeave: () => setHovered(null),
    onClick: () => setSelected((s) => (s === g ? null : g)),
    style: {
      cursor: 'pointer',
      transition: 'opacity 220ms ease, filter 220ms ease',
      ...fillFor(g),
    },
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
    const all = [
      ...groupsByStatus.recovering,
      ...groupsByStatus.fatigued,
      ...groupsByStatus.cooked,
    ];
    if (!all.length) return null;
    return all.sort((a, b) => (a.hoursRemaining || 99) - (b.hoursRemaining || 99))[0];
  }, [groupsByStatus]);

  const renderMuscle = (slug) => {
    const paths = getPathsForMuscle(slug, view);
    if (!paths.length) return null;

    const label = labelText(slug);
    const isActive = active === slug;

    return (
      <g key={slug} className="muscle-group">
        {paths.map(({ key, d }) => (
          <path
            key={key}
            d={d}
            stroke={isActive ? '#c6ff3d' : '#1a1f28'}
            strokeWidth={isActive ? 1.5 : 0.8}
            {...handlers(slug)}
          />
        ))}
        {label && (
          <text
            x={slug.includes('_l') ? 82 : slug.includes('_r') ? 138 : 110}
            y={{
              chest: 122, abs: 170, quads: 360, hamstrings: 360,
              glutes: 250, biceps: 145, triceps: 145, calves: 440,
              traps: 88, middle_back: 130, lower_back: 190, lats: 135,
            }[slug] || 100}
            textAnchor="middle"
            fontSize="9"
            fontWeight="700"
            fill={isActive ? '#c6ff3d' : '#0b0c0e'}
            pointerEvents="none"
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const musclesInView = getMusclesForView(view);

  return (
    <div className="card p-4 sm:p-6 space-y-5" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-semibold text-lg">Muscle Recovery</div>
          <div className="text-xs text-ink-400 mt-0.5">
            {groupsByStatus.fresh.length} fresh ·{' '}
            {groupsByStatus.cooled.length + groupsByStatus.recovering.length} recovering ·{' '}
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

      {/* 3-column layout: body | detail | pills */}
      <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6 items-start">
        {/* Body SVG */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-ink-850 rounded-full p-1 border border-ink-700">
            {['front', 'back'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1 rounded-full text-xs transition-all ${
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
            <svg
              viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
              width="240"
              height="480"
              className="relative shrink-0 select-none"
              style={{ overflow: 'visible' }}
            >
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
                <linearGradient id="gradNever" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2a3040" />
                  <stop offset="100%" stopColor="#1a1f28" />
                </linearGradient>
                <filter id="glowActive" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <style>{`
                  .muscle-group { transition: opacity 220ms ease; }
                  .body-outline { fill: #2a3040; stroke: #3a424f; stroke-width: 1; }
                `}</style>
              </defs>

              <g className="body-outline">
                {(BODY_PATHS[view]._base || []).map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
              {musclesInView.map((slug) => renderMuscle(slug))}
            </svg>
          </div>

          {nextReady && (
            <div className="text-[11px] text-ink-400 text-center max-w-[240px]">
              Next ready:{' '}
              <span className="text-accent font-medium">{LABELS[nextReady.muscleGroup]}</span>{' '}
              in {fmtHours(nextReady.hoursRemaining)}
            </div>
          )}
        </div>

        {/* Center: Detail panel with FIXED height container */}
        <div className="hidden lg:block">
          <div className="relative" style={{ minHeight: '480px' }}>
            {active && activeData ? (
              <div
                className="border rounded-xl p-5 transition-all duration-200"
                style={{
                  borderColor: recoverySolid(activeData.percent, activeNever) + '66',
                  background: `linear-gradient(135deg, ${recoverySolid(activeData.percent, activeNever)}11, transparent 60%)`,
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-xl">{LABELS[active] || active}</div>
                    <div className="text-xs text-ink-400 mt-0.5">
                      {activeNever ? 'Never trained' : `Last: ${fmtHours(activeData.hoursSince)} ago`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-4xl font-bold tabular-nums"
                      style={{ color: recoverySolid(activeData.percent, activeNever) }}
                    >
                      {activeNever ? '—' : `${Math.round(activeData.percent)}%`}
                    </div>
                    <div
                      className="text-[10px] uppercase tracking-wide mt-1"
                      style={{ color: activeData.status?.color }}
                    >
                      {activeData.status?.label || '—'}
                    </div>
                  </div>
                </div>

                <div className="h-3 bg-ink-800 rounded-full overflow-hidden mb-5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${activeNever ? 0 : activeData.percent}%`,
                      background: `linear-gradient(90deg, ${recoverySolid(activeData.percent, activeNever)}aa, ${recoverySolid(activeData.percent, activeNever)})`,
                      boxShadow: `0 0 12px ${recoverySolid(activeData.percent, activeNever)}66`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Half-life" value={fmtHours(activeData.halfLife || 48)} />
                  <Stat label="Hours since" value={activeData.hoursSince != null ? fmtHours(activeData.hoursSince) : '—'} />
                  <Stat label="Sets 7d" value={activeData.sets7d} />
                  <Stat label="Sets 30d" value={activeData.sets30d} />
                  <Stat label="Volume 7d" value={`${fmtNumber((activeData.volume7d || 0) / 1000, 1)}t`} />
                  <Stat label="Volume 30d" value={`${fmtNumber((activeData.volume30d || 0) / 1000, 1)}t`} />
                </div>

                {!activeNever && activeData.percent < 90 && (
                  <div className="mt-4 pt-4 border-t border-ink-700 text-xs flex items-center gap-2 text-ink-400">
                    <Info className="w-3 h-3" />
                    Fresh in{' '}
                    <span className="text-white font-medium">{fmtHours(activeData.hoursRemaining)}</span>
                  </div>
                )}
                {!activeNever && activeData.percent >= 90 && (
                  <div className="mt-4 pt-4 border-t border-ink-700 text-xs flex items-center gap-2 text-accent">
                    <Info className="w-3 h-3" /> Fresh — ready to train
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed border-ink-700 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
                <Info className="w-8 h-8 text-ink-500 mb-3" />
                <div className="text-sm text-ink-400">
                  Hover hoặc click vào một vùng cơ
                </div>
                <div className="text-xs text-ink-500 mt-1">
                  trên hình để xem chi tiết
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Status groups — FIXED list, không đổi khi hover */}
        <div className="space-y-3">
          {[
            { key: 'cooked', color: '#8a1f1f', title: 'Cooked' },
            { key: 'fatigued', color: '#ff5e5e', title: 'Fatigued' },
            { key: 'recovering', color: '#ff8f3d', title: 'Recovering' },
            { key: 'cooled', color: '#ffb038', title: 'Cooled' },
            { key: 'fresh', color: '#c6ff3d', title: 'Fresh' },
            { key: 'never', color: '#5a6470', title: 'Never' },
          ].map(({ key, color, title }) => {
            const items = groupsByStatus[key];
            if (!items?.length) return null;
            return (
              <StatusGroupFixed
                key={key}
                title={title}
                color={color}
                items={items}
                active={active}
                setHovered={setHovered}
                setSelected={setSelected}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: detail panel dưới body */}
      <div className="lg:hidden">
        {active && activeData && (
          <div
            className="border rounded-xl p-4"
            style={{
              borderColor: recoverySolid(activeData.percent, activeNever) + '66',
              background: `linear-gradient(135deg, ${recoverySolid(activeData.percent, activeNever)}11, transparent 60%)`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{LABELS[active]}</div>
              <button
                onClick={() => {
                  setHovered(null);
                  setSelected(null);
                }}
                className="text-ink-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-ink-400 mb-3">
              {activeNever ? 'Never trained' : `${Math.round(activeData.percent)}% · ${fmtHours(activeData.hoursRemaining)} until fresh`}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat label="Sets 7d" value={activeData.sets7d} />
              <Stat label="Volume 7d" value={`${fmtNumber((activeData.volume7d || 0) / 1000, 1)}t`} />
            </div>
          </div>
        )}
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

/**
 * Status group với chiều cao CỐ ĐỊNH để không đẩy pill khác.
 */
function StatusGroupFixed({ title, color, items, active, setHovered, setSelected }) {
  if (!items.length) return null;
  return (
    <div
      className="border border-ink-700 rounded-lg p-3"
      style={{ minHeight: '76px' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
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
              className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors flex items-center gap-1 ${
                isActive
                  ? 'border-accent bg-accent/10 text-white'
                  : 'border-ink-700 hover:border-ink-500 text-ink-300'
              }`}
              onMouseEnter={() => setHovered(r.muscleGroup)}
              onMouseLeave={() => setHovered(null)}
              onClick={() =>
                setSelected((s) => (s === r.muscleGroup ? null : r.muscleGroup))
              }
            >
              <span className="font-medium">{LABELS[r.muscleGroup]}</span>
              <span className="opacity-60">{Math.round(r.percent)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
