import { useEffect, useRef } from 'react';
import { BodyChart, ViewSide } from 'body-muscles';
import { recoveryToBodyState, BODY_MUSCLES_ID_TO_SLUG } from '../lib/bodyMusclesMap.js';

/**
 * Wrapper cho body-muscles library.
 * Thêm data-selected và z-index để fix overlap abs/serratus/obliques.
 */
export default function BodyMusclesChart({
  recovery = [],
  view = 'FRONT',
  selectedSlug = null,
  hoveredSlug = null,
  onMuscleClick,
  onMuscleHover,
  height = 520,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const libraryView = view === 'BACK' ? ViewSide.BACK : ViewSide.FRONT;

    chartRef.current = new BodyChart(containerRef.current, {
      view: libraryView,
      bodyState: {},
      onMuscleClick: (id, name) => {
        const slug = BODY_MUSCLES_ID_TO_SLUG[id];
        if (slug && onMuscleClick) onMuscleClick(slug, name);
      },
      onMuscleHover: (id) => {
        if (!onMuscleHover) return;
        if (!id) return onMuscleHover(null);
        const slug = BODY_MUSCLES_ID_TO_SLUG[id];
        if (slug) onMuscleHover(slug);
      },
      enableTransitions: true,
    });

    // Apply z-index + data-selected sau khi chart render
    setTimeout(() => applyLayering(containerRef.current), 0);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const libraryView = view === 'BACK' ? ViewSide.BACK : ViewSide.FRONT;
    chartRef.current.update({ view: libraryView });
    setTimeout(() => applyLayering(containerRef.current), 0);
  }, [view]);

  useEffect(() => {
    if (!chartRef.current) return;
    const bodyState = recoveryToBodyState(recovery, selectedSlug, hoveredSlug);
    chartRef.current.update({ bodyState });
    setTimeout(() => applyLayering(containerRef.current), 0);
  }, [recovery, selectedSlug, hoveredSlug]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="body-muscles-container"
    />
  );
}

/**
 * Áp dụng z-index cho các path để đảm bảo abs nằm trên cùng.
 */
function applyLayering(container) {
  if (!container) return;
  const svg = container.querySelector('svg');
  if (!svg) return;

  const paths = svg.querySelectorAll('path');

  // Thứ tự z-index ưu tiên (cao nhất render sau cùng)
  const priority = {
    abs: 100,
    obliques: 80,
    serratus: 60,
    spine: 40,
    chest: 30,
    lats: 25,
    traps: 20,
  };

  paths.forEach((p) => {
    const id = p.id || p.getAttribute('data-muscle') || p.getAttribute('aria-label') || '';
    let z = 0;

    if (id.startsWith('abs')) z = priority.abs;
    else if (id.startsWith('obliques')) z = priority.obliques;
    else if (id.startsWith('serratus')) z = priority.serratus;
    else if (id === 'spine') z = priority.spine;
    else if (id.startsWith('chest')) z = priority.chest;
    else if (id.startsWith('lats')) z = priority.lats;
    else if (id.startsWith('traps')) z = priority.traps;

    if (z > 0) {
      p.style.zIndex = z;
      p.style.position = 'relative';
    }

    // Data attribute cho CSS
    if (p.getAttribute('data-selected') === 'true') {
      p.style.filter = 'drop-shadow(0 0 4px rgba(198, 255, 61, 0.6))';
    }
  });
}
