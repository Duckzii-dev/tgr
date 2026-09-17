import { useEffect, useRef } from 'react';
import { BodyChart, ViewSide } from 'body-muscles';
import { recoveryToBodyState, BODY_MUSCLES_ID_TO_SLUG } from '../lib/bodyMusclesMap.js';

/**
 * Wrapper cho body-muscles library.
 * Render SVG body với 70+ regions, hỗ trợ intensity scale.
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

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return;

    const libraryView = view === 'BACK' ? ViewSide.BACK : ViewSide.FRONT;

    chartRef.current = new BodyChart(containerRef.current, {
      view: libraryView,
      bodyState: {},
      onMuscleClick: (id, name) => {
        // Map library id → system slug
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

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // Update view
  useEffect(() => {
    if (!chartRef.current) return;
    const libraryView = view === 'BACK' ? ViewSide.BACK : ViewSide.FRONT;
    chartRef.current.update({ view: libraryView });
  }, [view]);

  // Update bodyState
  useEffect(() => {
    if (!chartRef.current) return;
    const bodyState = recoveryToBodyState(recovery, selectedSlug, hoveredSlug);
    chartRef.current.update({ bodyState });
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
