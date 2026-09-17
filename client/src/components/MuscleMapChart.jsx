import { useEffect, useRef, useState } from 'react';
import {
  MuscleMapWidget,
  HeatmapLegend,
  setLocale,
  getMuscleName,
} from '../lib/MuscleMapJS/src/index.ts';
import { recoveryToHeatmap, MUSCLEMAP_ID_TO_SLUG } from '../lib/muscleMapJsMap.js';

/**
 * Wrapper cho MuscleMapJS widget.
 * Canvas2D rendering, DPR-aware, có tooltip + heatmap + legend.
 */
export default function MuscleMapChart({
  recovery = [],
  view = 'front',
  gender = 'male',
  selectedSlug = null,
  hoveredSlug = null,
  onMuscleClick,
  onMuscleHover,
  height = 540,
}) {
  const containerRef = useRef(null);
  const legendRef = useRef(null);
  const widgetRef = useRef(null);
  const legendInstanceRef = useRef(null);

  // Init widget + legend
  useEffect(() => {
    if (!containerRef.current) return;

    // Set locale
    setLocale('en');

    const widget = new MuscleMapWidget(containerRef.current, {
      gender,
      side: view,
      style: 'default',
      interactive: true,
      multiSelect: false,
      showSubGroups: false,
      onMuscleClick: (muscle, side) => {
        const slug = MUSCLEMAP_ID_TO_SLUG[muscle];
        if (slug && onMuscleClick) onMuscleClick(slug, muscle);
      },
    });

    // Tooltip với tên muscle + recovery status
    widget.enableTooltip((muscle, side) => {
      const name = getMuscleName(muscle);
      return `<div style="font-size: 12px;">
        <strong>${name}</strong><br/>
        <small style="opacity:0.7;">${side} side</small>
      </div>`;
    });

    // Hover events → map to slug
    widget.on('muscleEnter', (muscle) => {
      const slug = MUSCLEMAP_ID_TO_SLUG[muscle];
      if (slug && onMuscleHover) onMuscleHover(slug);
    });
    widget.on('muscleLeave', () => {
      if (onMuscleHover) onMuscleHover(null);
    });

    // Animation
    widget.enableAnimation(300);

    widgetRef.current = widget;

    // Legend
    if (legendRef.current) {
      legendInstanceRef.current = new HeatmapLegend(legendRef.current, {
        colorScale: 'workout',
        orientation: 'horizontal',
        barThickness: 14,
        labelMin: 'Fresh',
        labelMax: 'Cooked',
        steps: 32,
      });
    }

    return () => {
      widget.destroy();
      widgetRef.current = null;
      legendInstanceRef.current = null;
    };
  }, []);

  // Update view/gender
  useEffect(() => {
    if (!widgetRef.current) return;
    widgetRef.current.setSide(view);
    widgetRef.current.setGender(gender);
  }, [view, gender]);

  // Update heatmap từ recovery
  useEffect(() => {
    if (!widgetRef.current) return;

    const heatmap = recoveryToHeatmap(recovery);
    widgetRef.current.clearHighlights();

    if (heatmap.length > 0) {
      widgetRef.current.setHeatmap(heatmap, {
        colorScale: 'workout',
        interpolation: { type: 'easeInOut' },
        threshold: 0.05,
        gradientFill: true,
        gradientDirection: 'topToBottom',
      });
    }
  }, [recovery]);

  // Update selection
  useEffect(() => {
    if (!widgetRef.current) return;

    widgetRef.current.clearSelection();

    const active = selectedSlug || hoveredSlug;
    if (!active) return;

    // Find matching muscle IDs
    const ids = Object.entries(MUSCLEMAP_ID_TO_SLUG)
      .filter(([_, slug]) => slug === active)
      .map(([id]) => id);

    if (ids.length > 0) {
      widgetRef.current.selectMany(ids);
    }
  }, [selectedSlug, hoveredSlug]);

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      <div
        ref={legendRef}
        style={{
          width: '80%',
          maxWidth: '320px',
          height: '40px',
        }}
      />
    </div>
  );
}
