/**
 * Body SVG paths — anatomy chuẩn, tỷ lệ người lớn.
 * ViewBox: 220 × 500 (1 head ≈ 66px, 7.5 heads tall).
 */

export const VIEWBOX = { width: 220, height: 500 };

const CX = 110;

export const BODY_PATHS = {
  // ============================================================
  // FRONT VIEW
  // ============================================================
  front: {
    _base: [
      // Head + neck
      `M ${CX} 12 Q ${CX + 18} 12 ${CX + 18} 32 Q ${CX + 18} 52 ${CX + 12} 56 L ${CX + 10} 62 L ${CX - 10} 62 L ${CX - 12} 56 Q ${CX - 18} 52 ${CX - 18} 32 Q ${CX - 18} 12 ${CX} 12 Z`,
      // Torso
      `M ${CX - 10} 62 L ${CX - 34} 78 Q ${CX - 38} 88 ${CX - 36} 110 L ${CX - 32} 200 Q ${CX - 30} 215 ${CX - 28} 230 L ${CX - 30} 300 L ${CX + 30} 300 L ${CX + 28} 230 Q ${CX + 30} 215 ${CX + 32} 200 L ${CX + 36} 110 Q ${CX + 38} 88 ${CX + 34} 78 L ${CX + 10} 62 Z`,
      // Left arm
      `M ${CX - 36} 78 Q ${CX - 48} 80 ${CX - 50} 100 L ${CX - 52} 180 Q ${CX - 54} 200 ${CX - 52} 220 L ${CX - 40} 220 L ${CX - 38} 180 L ${CX - 36} 100 Q ${CX - 36} 88 ${CX - 34} 78 Z`,
      // Right arm
      `M ${CX + 36} 78 Q ${CX + 48} 80 ${CX + 50} 100 L ${CX + 52} 180 Q ${CX + 54} 200 ${CX + 52} 220 L ${CX + 40} 220 L ${CX + 38} 180 L ${CX + 36} 100 Q ${CX + 36} 88 ${CX + 34} 78 Z`,
      // Left leg
      `M ${CX - 28} 305 L ${CX - 6} 305 L ${CX - 8} 400 L ${CX - 10} 500 L ${CX - 28} 500 L ${CX - 26} 400 Z`,
      // Right leg
      `M ${CX + 6} 305 L ${CX + 28} 305 L ${CX + 26} 400 L ${CX + 28} 500 L ${CX + 10} 500 L ${CX + 8} 400 Z`,
    ],

    neck: `M ${CX - 10} 62 L ${CX + 10} 62 L ${CX + 8} 76 L ${CX - 8} 76 Z`,

    traps: `M ${CX - 34} 78 Q ${CX} 68 ${CX + 34} 78 L ${CX + 30} 92 Q ${CX} 84 ${CX - 30} 92 Z`,

    front_delt_l: `M ${CX - 36} 80 Q ${CX - 52} 82 ${CX - 54} 96 Q ${CX - 54} 108 ${CX - 44} 110 L ${CX - 36} 100 Z`,
    front_delt_r: `M ${CX + 36} 80 Q ${CX + 52} 82 ${CX + 54} 96 Q ${CX + 54} 108 ${CX + 44} 110 L ${CX + 36} 100 Z`,

    side_delt_l: `M ${CX - 52} 96 Q ${CX - 58} 108 ${CX - 56} 120 L ${CX - 50} 122 Q ${CX - 48} 110 ${CX - 46} 100 Z`,
    side_delt_r: `M ${CX + 52} 96 Q ${CX + 58} 108 ${CX + 56} 120 L ${CX + 50} 122 Q ${CX + 48} 110 ${CX + 46} 100 Z`,

    upper_chest: `M ${CX - 30} 92 Q ${CX} 86 ${CX + 30} 92 L ${CX + 28} 110 Q ${CX} 104 ${CX - 28} 110 Z`,

    chest: `M ${CX - 28} 110 Q ${CX} 106 ${CX + 28} 110 L ${CX + 26} 132 Q ${CX} 138 ${CX - 26} 132 Z`,

    biceps_l: `M ${CX - 48} 128 Q ${CX - 54} 142 ${CX - 52} 165 L ${CX - 42} 168 Q ${CX - 42} 145 ${CX - 40} 130 Z`,
    biceps_r: `M ${CX + 48} 128 Q ${CX + 54} 142 ${CX + 52} 165 L ${CX + 42} 168 Q ${CX + 42} 145 ${CX + 40} 130 Z`,

    forearms_l: `M ${CX - 50} 170 Q ${CX - 52} 190 ${CX - 50} 210 L ${CX - 42} 212 Q ${CX - 42} 190 ${CX - 42} 172 Z`,
    forearms_r: `M ${CX + 50} 170 Q ${CX + 52} 190 ${CX + 50} 210 L ${CX + 42} 212 Q ${CX + 42} 190 ${CX + 42} 172 Z`,

    abs: `M ${CX - 22} 138 L ${CX + 22} 138 L ${CX + 20} 200 L ${CX - 20} 200 Z`,

    obliques_l: `M ${CX - 30} 138 L ${CX - 24} 140 L ${CX - 22} 200 L ${CX - 28} 200 Z`,
    obliques_r: `M ${CX + 30} 138 L ${CX + 24} 140 L ${CX + 22} 200 L ${CX + 28} 200 Z`,

    quads_l: `M ${CX - 28} 305 L ${CX - 6} 305 L ${CX - 8} 400 L ${CX - 26} 400 Z`,
    quads_r: `M ${CX + 6} 305 L ${CX + 28} 305 L ${CX + 26} 400 L ${CX + 8} 400 Z`,

    calves_l: `M ${CX - 26} 405 Q ${CX - 30} 440 ${CX - 28} 480 L ${CX - 12} 480 Q ${CX - 10} 440 ${CX - 10} 405 Z`,
    calves_r: `M ${CX + 10} 405 Q ${CX + 10} 440 ${CX + 12} 480 L ${CX + 28} 480 Q ${CX + 30} 440 ${CX + 26} 405 Z`,
  },

  // ============================================================
  // BACK VIEW
  // ============================================================
  back: {
    _base: [
      `M ${CX} 12 Q ${CX + 18} 12 ${CX + 18} 32 Q ${CX + 18} 52 ${CX + 12} 56 L ${CX + 10} 62 L ${CX - 10} 62 L ${CX - 12} 56 Q ${CX - 18} 52 ${CX - 18} 32 Q ${CX - 18} 12 ${CX} 12 Z`,
      `M ${CX - 10} 62 L ${CX - 34} 78 Q ${CX - 38} 88 ${CX - 36} 110 L ${CX - 32} 200 Q ${CX - 30} 215 ${CX - 28} 230 L ${CX - 30} 300 L ${CX + 30} 300 L ${CX + 28} 230 Q ${CX + 30} 215 ${CX + 32} 200 L ${CX + 36} 110 Q ${CX + 38} 88 ${CX + 34} 78 L ${CX + 10} 62 Z`,
      `M ${CX - 36} 78 Q ${CX - 48} 80 ${CX - 50} 100 L ${CX - 52} 180 Q ${CX - 54} 200 ${CX - 52} 220 L ${CX - 40} 220 L ${CX - 38} 180 L ${CX - 36} 100 Z`,
      `M ${CX + 36} 78 Q ${CX + 48} 80 ${CX + 50} 100 L ${CX + 52} 180 Q ${CX + 54} 200 ${CX + 52} 220 L ${CX + 40} 220 L ${CX + 38} 180 L ${CX + 36} 100 Z`,
      `M ${CX - 28} 305 L ${CX - 6} 305 L ${CX - 8} 400 L ${CX - 10} 500 L ${CX - 28} 500 L ${CX - 26} 400 Z`,
      `M ${CX + 6} 305 L ${CX + 28} 305 L ${CX + 26} 400 L ${CX + 28} 500 L ${CX + 10} 500 L ${CX + 8} 400 Z`,
    ],

    neck: `M ${CX - 10} 62 L ${CX + 10} 62 L ${CX + 8} 76 L ${CX - 8} 76 Z`,

    traps: `M ${CX - 34} 78 Q ${CX} 66 ${CX + 34} 78 L ${CX + 26} 100 Q ${CX} 92 ${CX - 26} 100 Z`,

    rear_delt_l: `M ${CX - 40} 92 Q ${CX - 56} 92 ${CX - 58} 108 L ${CX - 50} 118 Q ${CX - 48} 108 ${CX - 44} 100 Z`,
    rear_delt_r: `M ${CX + 40} 92 Q ${CX + 56} 92 ${CX + 58} 108 L ${CX + 50} 118 Q ${CX + 48} 108 ${CX + 44} 100 Z`,

    side_delt_l: `M ${CX - 50} 120 Q ${CX - 54} 128 ${CX - 52} 138 L ${CX - 46} 138 Q ${CX - 46} 128 ${CX - 46} 118 Z`,
    side_delt_r: `M ${CX + 50} 120 Q ${CX + 54} 128 ${CX + 52} 138 L ${CX + 46} 138 Q ${CX + 46} 128 ${CX + 46} 118 Z`,

    lats_l: `M ${CX - 32} 100 Q ${CX - 40} 130 ${CX - 30} 170 L ${CX - 12} 170 L ${CX - 14} 104 Q ${CX - 22} 100 ${CX - 32} 100 Z`,
    lats_r: `M ${CX + 32} 100 Q ${CX + 40} 130 ${CX + 30} 170 L ${CX + 12} 170 L ${CX + 14} 104 Q ${CX + 22} 100 ${CX + 32} 100 Z`,

    middle_back: `M ${CX - 12} 100 L ${CX + 12} 100 L ${CX + 12} 160 L ${CX - 12} 160 Z`,

    lower_back: `M ${CX - 12} 165 L ${CX + 12} 165 L ${CX + 10} 215 L ${CX - 10} 215 Z`,

    triceps_l: `M ${CX - 48} 128 Q ${CX - 54} 145 ${CX - 52} 165 L ${CX - 42} 168 Q ${CX - 42} 145 ${CX - 40} 130 Z`,
    triceps_r: `M ${CX + 48} 128 Q ${CX + 54} 145 ${CX + 52} 165 L ${CX + 42} 168 Q ${CX + 42} 145 ${CX + 40} 130 Z`,

    forearms_l: `M ${CX - 50} 170 Q ${CX - 52} 190 ${CX - 50} 210 L ${CX - 42} 212 Q ${CX - 42} 190 ${CX - 42} 172 Z`,
    forearms_r: `M ${CX + 50} 170 Q ${CX + 52} 190 ${CX + 50} 210 L ${CX + 42} 212 Q ${CX + 42} 190 ${CX + 42} 172 Z`,

    glutes_l: `M ${CX - 28} 220 Q ${CX - 30} 250 ${CX - 24} 275 L ${CX - 4} 275 L ${CX - 6} 220 Z`,
    glutes_r: `M ${CX + 28} 220 Q ${CX + 30} 250 ${CX + 24} 275 L ${CX + 4} 275 L ${CX + 6} 220 Z`,

    hamstrings_l: `M ${CX - 28} 305 Q ${CX - 30} 360 ${CX - 26} 400 L ${CX - 8} 400 Q ${CX - 10} 360 ${CX - 6} 305 Z`,
    hamstrings_r: `M ${CX + 28} 305 Q ${CX + 30} 360 ${CX + 26} 400 L ${CX + 8} 400 Q ${CX + 10} 360 ${CX + 6} 305 Z`,

    calves_l: `M ${CX - 26} 405 Q ${CX - 30} 440 ${CX - 28} 480 L ${CX - 12} 480 Q ${CX - 10} 440 ${CX - 10} 405 Z`,
    calves_r: `M ${CX + 10} 405 Q ${CX + 10} 440 ${CX + 12} 480 L ${CX + 28} 480 Q ${CX + 30} 440 ${CX + 26} 405 Z`,
  },
};

export const MUSCLE_TO_PATHS = {
  neck: { front: ['neck'], back: ['neck'] },
  traps: { front: ['traps'], back: ['traps'] },
  front_delt: { front: ['front_delt_l', 'front_delt_r'], back: [] },
  side_delt: { front: ['side_delt_l', 'side_delt_r'], back: ['side_delt_l', 'side_delt_r'] },
  rear_delt: { front: [], back: ['rear_delt_l', 'rear_delt_r'] },
  upper_chest: { front: ['upper_chest'], back: [] },
  chest: { front: ['chest'], back: [] },
  lats: { front: [], back: ['lats_l', 'lats_r'] },
  middle_back: { front: [], back: ['middle_back'] },
  lower_back: { front: [], back: ['lower_back'] },
  biceps: { front: ['biceps_l', 'biceps_r'], back: [] },
  triceps: { front: [], back: ['triceps_l', 'triceps_r'] },
  forearms: { front: ['forearms_l', 'forearms_r'], back: ['forearms_l', 'forearms_r'] },
  abs: { front: ['abs'], back: [] },
  obliques: { front: ['obliques_l', 'obliques_r'], back: [] },
  glutes: { front: [], back: ['glutes_l', 'glutes_r'] },
  quads: { front: ['quads_l', 'quads_r'], back: [] },
  hamstrings: { front: [], back: ['hamstrings_l', 'hamstrings_r'] },
  calves: { front: ['calves_l', 'calves_r'], back: ['calves_l', 'calves_r'] },
};

export function getPathsForMuscle(slug, view) {
  const map = MUSCLE_TO_PATHS[slug];
  if (!map) return [];
  const keys = map[view] || [];
  const paths = BODY_PATHS[view] || {};
  return keys.map((k) => ({ key: k, d: paths[k] })).filter((p) => p.d);
}

export function getMusclesForView(view) {
  const result = [];
  for (const [slug, map] of Object.entries(MUSCLE_TO_PATHS)) {
    if ((map[view] || []).length > 0) result.push(slug);
  }
  return result;
}
