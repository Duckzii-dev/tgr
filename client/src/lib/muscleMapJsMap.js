/**
 * Map system muscle slug → MuscleMapJS muscle IDs.
 * MuscleMapJS dùng kebab-case: 'upper-chest', 'front-deltoid', ...
 */

export const SLUG_TO_MUSCLEMAP_IDS = {
  // ============ NECK ============
  neck: ['neck'],

  // ============ CHEST ============
  upper_chest: ['upper-chest'],
  chest: ['chest', 'lower-chest'],

  // ============ SHOULDERS ============
  front_delt: ['front-deltoid', 'deltoids'],
  side_delt: ['deltoids'],
  rear_delt: ['rear-deltoid'],

  // ============ BACK ============
  traps: ['trapezius', 'upper-trapezius', 'lower-trapezius'],
  lats: ['upper-back'],
  middle_back: ['rhomboids', 'upper-back'],
  lower_back: ['lower-back'],

  // ============ ARMS ============
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearm'],

  // ============ CORE ============
  abs: ['abs', 'upper-abs', 'lower-abs'],
  obliques: ['obliques', 'serratus'],

  // ============ LEGS ============
  glutes: ['gluteal'],
  quads: ['quadriceps', 'inner-quad', 'outer-quad'],
  hamstrings: ['hamstring'],
  calves: ['calves', 'tibialis'],

  // ============ EXTRA ============
  cardio: [],
  rotator_cuff: ['rotator-cuff'],
  hip_flexors: ['hip-flexors'],
  adductors: ['adductors'],
};

/**
 * Reverse mapping.
 */
export const MUSCLEMAP_ID_TO_SLUG = (() => {
  const map = {};
  for (const [slug, ids] of Object.entries(SLUG_TO_MUSCLEMAP_IDS)) {
    for (const id of ids) {
      // Only first slug wins for reverse mapping
      if (!map[id]) map[id] = slug;
    }
  }
  return map;
})();

/**
 * Convert recovery percent (0-100) → intensity (0-1) cho MuscleMapJS.
 *  - percent ≥ 90 (fresh) → intensity 0.0 (cool)
 *  - percent ≤ 15 (cooked) → intensity 1.0 (hot)
 */
export function percentToIntensity(percent) {
  if (percent >= 90) return 0;
  if (percent <= 15) return 1;
  return Math.max(0, Math.min(1, (100 - percent) / 100));
}

/**
 * Convert recovery array → heatmap data cho MuscleMapJS.
 * MuscleMapJS setHeatmap([{ muscle, intensity }, ...])
 */
export function recoveryToHeatmap(recovery) {
  const map = new Map(); // muscleId → max intensity

  for (const r of recovery) {
    if (r.neverTrained) continue;

    const ids = SLUG_TO_MUSCLEMAP_IDS[r.muscleGroup] || [];
    const intensity = percentToIntensity(r.percent);

    for (const id of ids) {
      const cur = map.get(id);
      if (cur === undefined || intensity > cur) {
        map.set(id, intensity);
      }
    }
  }

  return [...map.entries()].map(([muscle, intensity]) => ({
    muscle,
    intensity,
  }));
}
