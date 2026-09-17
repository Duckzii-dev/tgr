/**
 * Map system muscle slug → body-muscles library IDs.
 * IDs verified từ body-muscles v1.x.
 */

export const SLUG_TO_BODY_MUSCLES_IDS = {
  // ============ NECK ============
  neck: [
    'neck-left',
    'neck-right',
    'nape',
    'head-back',
  ],

  // ============ CHEST ============
  upper_chest: [
    'chest-upper-left',
    'chest-upper-right',
  ],
  chest: [
    'chest-lower-left',
    'chest-lower-right',
  ],

  // ============ SHOULDERS ============
  front_delt: [
    'shoulder-front-left',
    'shoulder-front-right',
  ],
  side_delt: [
    'shoulder-side-left',
    'shoulder-side-right',
  ],
  rear_delt: [
    'deltoid-rear-left',
    'deltoid-rear-right',
  ],

  // ============ BACK ============
  traps: [
    'traps-upper-left',
    'traps-mid-left',
    'traps-lower-left',
    'traps-upper-right',
    'traps-mid-right',
    'traps-lower-right',
  ],
  lats: [
    'lats-upper-left',
    'lats-mid-left',
    'lats-lower-left',
    'lats-upper-right',
    'lats-mid-right',
    'lats-lower-right',
  ],
  middle_back: [
    'traps-mid-left',
    'traps-mid-right',
    'lats-mid-left',
    'lats-mid-right',
  ],
  lower_back: [
    'lower-back-erectors-left',
    'lower-back-erectors-right',
    'lower-back-ql-left',
    'lower-back-ql-right',
    'spine',
  ],

  // ============ ARMS ============
  biceps: [
    'biceps-left',
    'biceps-right',
  ],
  triceps: [
    'triceps-long-left',
    'triceps-lateral-left',
    'triceps-long-right',
    'triceps-lateral-right',
  ],
  forearms: [
    'forearm-left',
    'forearm-right',
    'forearm-flexors-left',
    'forearm-extensors-left',
    'forearm-flexors-right',
    'forearm-extensors-right',
  ],

  // ============ CORE ============
  abs: [
    'abs-upper-left',
    'abs-upper-right',
    'abs-lower-left',
    'abs-lower-right',
  ],
  obliques: [
    'obliques-left',
    'obliques-right',
    'serratus-anterior-left',
    'serratus-anterior-right',
  ],

  // ============ LEGS ============
  glutes: [
    'gluteus-maximus-left',
    'gluteus-maximus-right',
    'gluteus-medius-left',
    'gluteus-medius-right',
  ],
  quads: [
    'quads-left',
    'quads-right',
  ],
  hamstrings: [
    'hamstrings-medial-left',
    'hamstrings-lateral-left',
    'hamstrings-medial-right',
    'hamstrings-lateral-right',
  ],
  calves: [
    'calves-gastroc-medial-left',
    'calves-gastroc-lateral-left',
    'calves-soleus-left',
    'calves-gastroc-medial-right',
    'calves-gastroc-lateral-right',
    'calves-soleus-right',
    'tibialis-anterior-left',
    'tibialis-anterior-right',
  ],
};

/**
 * Reverse mapping.
 */
export const BODY_MUSCLES_ID_TO_SLUG = (() => {
  const map = {};
  for (const [slug, ids] of Object.entries(SLUG_TO_BODY_MUSCLES_IDS)) {
    for (const id of ids) {
      if (!map[id]) map[id] = slug;
    }
  }
  return map;
})();

export function percentToIntensity(percent) {
  if (percent >= 90) return 0;
  if (percent <= 15) return 10;
  const intensity = Math.round(((100 - percent) / 100) * 10);
  return Math.max(0, Math.min(10, intensity));
}

export function recoveryToBodyState(recovery, selectedSlug = null, hoveredSlug = null) {
  const state = {};

  for (const r of recovery) {
    const ids = SLUG_TO_BODY_MUSCLES_IDS[r.muscleGroup];
    if (!ids) continue;

    const intensity = r.neverTrained ? 0 : percentToIntensity(r.percent);
    const isSelected = r.muscleGroup === selectedSlug;
    const isHovered = r.muscleGroup === hoveredSlug;

    for (const id of ids) {
      state[id] = {
        intensity,
        selected: isSelected || isHovered,
      };
    }
  }

  return state;
}
