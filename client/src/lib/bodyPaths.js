/**
 * Body SVG paths — phiên bản "đô con" (V-taper, wide shoulders).
 * ViewBox: 220 × 520
 * Tỷ lệ: đầu ~62px, vai rộng 140px, eo 90px.
 */

export const VIEWBOX = { width: 220, height: 520 };

const CX = 110;

export const BODY_PATHS = {
  // ============================================================
  // FRONT VIEW
  // ============================================================
  front: {
    _base: [
      // Head (slightly wider, stronger jaw)
      `M ${CX} 8 Q ${CX + 20} 8 ${CX + 20} 28 Q ${CX + 20} 46 ${CX + 16} 54 L ${CX + 12} 60 L ${CX - 12} 60 L ${CX - 16} 54 Q ${CX - 20} 46 ${CX - 20} 28 Q ${CX - 20} 8 ${CX} 8 Z`,
      // Neck (thick, trapezius slope)
      `M ${CX - 14} 58 L ${CX - 14} 72 L ${CX - 44} 80 L ${CX - 50} 96 L ${CX - 50} 120 L ${CX - 52} 200 L ${CX - 44} 240 L ${CX - 40} 300 L ${CX + 40} 300 L ${CX + 44} 240 L ${CX + 52} 200 L ${CX + 50} 120 L ${CX + 50} 96 L ${CX + 44} 80 L ${CX + 14} 72 L ${CX + 14} 58 Z`,
      // Left arm (with bicep bulge)
      `M ${CX - 48} 82 Q ${CX - 64} 86 ${CX - 68} 110 L ${CX - 70} 170 L ${CX - 66} 190 L ${CX - 58} 210 L ${CX - 56} 230 L ${CX - 46} 230 L ${CX - 48} 210 L ${CX - 52} 190 L ${CX - 52} 170 L ${CX - 48} 110 Q ${CX - 42} 88 ${CX - 40} 82 Z`,
      // Right arm
      `M ${CX + 48} 82 Q ${CX + 64} 86 ${CX + 68} 110 L ${CX + 70} 170 L ${CX + 66} 190 L ${CX + 58} 210 L ${CX + 56} 230 L ${CX + 46} 230 L ${CX + 48} 210 L ${CX + 52} 190 L ${CX + 52} 170 L ${CX + 48} 110 Q ${CX + 42} 88 ${CX + 40} 82 Z`,
      // Left leg (thick quad + calf)
      `M ${CX - 40} 305 Q ${CX - 42} 330 ${CX - 40} 380 L ${CX - 38} 420 Q ${CX - 36} 460 ${CX - 34} 500 L ${CX - 36} 520 L ${CX - 6} 520 L ${CX - 8} 420 L ${CX - 6} 380 L ${CX - 6} 305 Z`,
      // Right leg
      `M ${CX + 6} 305 L ${CX + 6} 380 L ${CX + 8} 420 L ${CX + 6} 520 L ${CX + 36} 520 L ${CX + 34} 500 Q ${CX + 36} 460 ${CX + 38} 420 L ${CX + 40} 380 Q ${CX + 42} 330 ${CX + 40} 305 Z`,
    ],

    // Neck front
    neck: `M ${CX - 14} 58 L ${CX + 14} 58 L ${CX + 12} 72 L ${CX - 12} 72 Z`,

    // Traps (V-slope to shoulders)
    traps: `M ${CX - 44} 80 Q ${CX - 20} 70 ${CX} 68 Q ${CX + 20} 70 ${CX + 44} 80 L ${CX + 40} 92 Q ${CX + 20} 86 ${CX} 84 Q ${CX - 20} 86 ${CX - 40} 92 Z`,

    // Front delts (rounded caps)
    front_delt_l: `M ${CX - 48} 82 Q ${CX - 68} 84 ${CX - 70} 100 Q ${CX - 72} 116 ${CX - 60} 120 Q ${CX - 52} 118 ${CX - 44} 108 L ${CX - 44} 90 Z`,
    front_delt_r: `M ${CX + 48} 82 Q ${CX + 68} 84 ${CX + 70} 100 Q ${CX + 72} 116 ${CX + 60} 120 Q ${CX + 52} 118 ${CX + 44} 108 L ${CX + 44} 90 Z`,

    // Side delts (bulge)
    side_delt_l: `M ${CX - 68} 96 Q ${CX - 76} 108 ${CX - 74} 128 Q ${CX - 68} 132 ${CX - 62} 128 Q ${CX - 62} 116 ${CX - 58} 104 Z`,
    side_delt_r: `M ${CX + 68} 96 Q ${CX + 76} 108 ${CX + 74} 128 Q ${CX + 68} 132 ${CX + 62} 128 Q ${CX + 62} 116 ${CX + 58} 104 Z`,

    // Upper chest (pectoral upper)
    upper_chest: `M ${CX - 40} 92 Q ${CX - 20} 84 ${CX} 82 Q ${CX + 20} 84 ${CX + 40} 92 L ${CX + 38} 112 Q ${CX + 20} 106 ${CX} 104 Q ${CX - 20} 106 ${CX - 38} 112 Z`,

    // Mid/lower chest (pec mass)
    chest: `M ${CX - 38} 114 Q ${CX - 20} 108 ${CX} 108 Q ${CX + 20} 108 ${CX + 38} 114 L ${CX + 34} 142 Q ${CX + 18} 148 ${CX} 148 Q ${CX - 18} 148 ${CX - 34} 142 Z`,

    // Biceps (bulge on upper arm)
    biceps_l: `M ${CX - 58} 126 Q ${CX - 68} 140 ${CX - 68} 162 Q ${CX - 62} 172 ${CX - 54} 170 Q ${CX - 52} 150 ${CX - 48} 132 Z`,
    biceps_r: `M ${CX + 58} 126 Q ${CX + 68} 140 ${CX + 68} 162 Q ${CX + 62} 172 ${CX + 54} 170 Q ${CX + 52} 150 ${CX + 48} 132 Z`,

    // Forearms
    forearms_l: `M ${CX - 58} 174 Q ${CX - 60} 194 ${CX - 58} 214 Q ${CX - 52} 220 ${CX - 48} 218 Q ${CX - 48} 196 ${CX - 48} 176 Z`,
    forearms_r: `M ${CX + 58} 174 Q ${CX + 60} 194 ${CX + 58} 214 Q ${CX + 52} 220 ${CX + 48} 218 Q ${CX + 48} 196 ${CX + 48} 176 Z`,

    // Abs (6-pack, có đường kẻ giữa)
    abs: `M ${CX - 24} 152 L ${CX + 24} 152 L ${CX + 22} 226 L ${CX - 22} 226 Z`,

    // Obliques
    obliques_l: `M ${CX - 34} 152 L ${CX - 26} 154 L ${CX - 24} 226 L ${CX - 32} 226 Z`,
    obliques_r: `M ${CX + 34} 152 L ${CX + 26} 154 L ${CX + 24} 226 L ${CX + 32} 226 Z`,

    // Quads (thick thigh)
    quads_l: `M ${CX - 40} 305 Q ${CX - 44} 350 ${CX - 40} 400 L ${CX - 6} 400 L ${CX - 6} 305 Z`,
    quads_r: `M ${CX + 6} 305 L ${CX + 6} 400 L ${CX + 40} 400 Q ${CX + 44} 350 ${CX + 40} 305 Z`,

    // Calves front (tibialis)
    calves_l: `M ${CX - 36} 405 Q ${CX - 38} 440 ${CX - 36} 480 L ${CX - 12} 480 Q ${CX - 10} 440 ${CX - 10} 405 Z`,
    calves_r: `M ${CX + 10} 405 Q ${CX + 10} 440 ${CX + 12} 480 L ${CX + 36} 480 Q ${CX + 38} 440 ${CX + 36} 405 Z`,
  },

  // ============================================================
  // BACK VIEW
  // ============================================================
  back: {
    _base: [
      `M ${CX} 8 Q ${CX + 20} 8 ${CX + 20} 28 Q ${CX + 20} 46 ${CX + 16} 54 L ${CX + 12} 60 L ${CX - 12} 60 L ${CX - 16} 54 Q ${CX - 20} 46 ${CX - 20} 28 Q ${CX - 20} 8 ${CX} 8 Z`,
      `M ${CX - 14} 58 L ${CX - 14} 72 L ${CX - 44} 80 L ${CX - 50} 96 L ${CX - 50} 120 L ${CX - 52} 200 L ${CX - 44} 240 L ${CX - 40} 300 L ${CX + 40} 300 L ${CX + 44} 240 L ${CX + 52} 200 L ${CX + 50} 120 L ${CX + 50} 96 L ${CX + 44} 80 L ${CX + 14} 72 L ${CX + 14} 58 Z`,
      `M ${CX - 48} 82 Q ${CX - 64} 86 ${CX - 68} 110 L ${CX - 70} 170 L ${CX - 66} 190 L ${CX - 58} 210 L ${CX - 56} 230 L ${CX - 46} 230 L ${CX - 48} 210 L ${CX - 52} 190 L ${CX - 52} 170 L ${CX - 48} 110 Q ${CX - 42} 88 ${CX - 40} 82 Z`,
      `M ${CX + 48} 82 Q ${CX + 64} 86 ${CX + 68} 110 L ${CX + 70} 170 L ${CX + 66} 190 L ${CX + 58} 210 L ${CX + 56} 230 L ${CX + 46} 230 L ${CX + 48} 210 L ${CX + 52} 190 L ${CX + 52} 170 L ${CX + 48} 110 Q ${CX + 42} 88 ${CX + 40} 82 Z`,
      `M ${CX - 40} 305 Q ${CX - 42} 330 ${CX - 40} 380 L ${CX - 38} 420 Q ${CX - 36} 460 ${CX - 34} 500 L ${CX - 36} 520 L ${CX - 6} 520 L ${CX - 8} 420 L ${CX - 6} 380 L ${CX - 6} 305 Z`,
      `M ${CX + 6} 305 L ${CX + 6} 380 L ${CX + 8} 420 L ${CX + 6} 520 L ${CX + 36} 520 L ${CX + 34} 500 Q ${CX + 36} 460 ${CX + 38} 420 L ${CX + 40} 380 Q ${CX + 42} 330 ${CX + 40} 305 Z`,
    ],

    neck: `M ${CX - 14} 58 L ${CX + 14} 58 L ${CX + 12} 72 L ${CX - 12} 72 Z`,

    // Traps (diamond shape, wider)
    traps: `M ${CX - 44} 80 Q ${CX - 20} 66 ${CX} 62 Q ${CX + 20} 66 ${CX + 44} 80 L ${CX + 36} 106 Q ${CX + 20} 96 ${CX} 94 Q ${CX - 20} 96 ${CX - 36} 106 Z`,

    // Rear delts
    rear_delt_l: `M ${CX - 50} 90 Q ${CX - 68} 88 ${CX - 72} 106 Q ${CX - 74} 122 ${CX - 60} 128 Q ${CX - 52} 122 ${CX - 46} 108 Z`,
    rear_delt_r: `M ${CX + 50} 90 Q ${CX + 68} 88 ${CX + 72} 106 Q ${CX + 74} 122 ${CX + 60} 128 Q ${CX + 52} 122 ${CX + 46} 108 Z`,

    // Side delts (back view)
    side_delt_l: `M ${CX - 68} 128 Q ${CX - 74} 140 ${CX - 72} 154 Q ${CX - 64} 156 ${CX - 60} 148 Q ${CX - 58} 134 ${CX - 58} 124 Z`,
    side_delt_r: `M ${CX + 68} 128 Q ${CX + 74} 140 ${CX + 72} 154 Q ${CX + 64} 156 ${CX + 60} 148 Q ${CX + 58} 134 ${CX + 58} 124 Z`,

    // Lats (wide V-shape)
    lats_l: `M ${CX - 40} 98 Q ${CX - 50} 130 ${CX - 40} 180 L ${CX - 14} 180 L ${CX - 16} 100 Q ${CX - 26} 96 ${CX - 40} 98 Z`,
    lats_r: `M ${CX + 40} 98 Q ${CX + 50} 130 ${CX + 40} 180 L ${CX + 14} 180 L ${CX + 16} 100 Q ${CX + 26} 96 ${CX + 40} 98 Z`,

    // Middle back (rhomboids)
    middle_back: `M ${CX - 16} 100 L ${CX + 16} 100 L ${CX + 16} 172 L ${CX - 16} 172 Z`,

    // Lower back (erector spinae)
    lower_back: `M ${CX - 14} 178 L ${CX + 14} 178 L ${CX + 12} 240 L ${CX - 12} 240 Z`,

    // Triceps
    triceps_l: `M ${CX - 58} 126 Q ${CX - 68} 142 ${CX - 68} 164 Q ${CX - 62} 174 ${CX - 54} 172 Q ${CX - 52} 152 ${CX - 48} 132 Z`,
    triceps_r: `M ${CX + 58} 126 Q ${CX + 68} 142 ${CX + 68} 164 Q ${CX + 62} 174 ${CX + 54} 172 Q ${CX + 52} 152 ${CX + 48} 132 Z`,

    // Forearms
    forearms_l: `M ${CX - 58} 176 Q ${CX - 60} 196 ${CX - 58} 216 Q ${CX - 52} 222 ${CX - 48} 220 Q ${CX - 48} 198 ${CX - 48} 178 Z`,
    forearms_r: `M ${CX + 58} 176 Q ${CX + 60} 196 ${CX + 58} 216 Q ${CX + 52} 222 ${CX + 48} 220 Q ${CX + 48} 198 ${CX + 48} 178 Z`,

    // Glutes (rounded, muscular)
    glutes_l: `M ${CX - 40} 245 Q ${CX - 44} 270 ${CX - 34} 295 Q ${CX - 20} 300 ${CX - 6} 298 L ${CX - 6} 245 Q ${CX - 22} 240 ${CX - 40} 245 Z`,
    glutes_r: `M ${CX + 40} 245 Q ${CX + 44} 270 ${CX + 34} 295 Q ${CX + 20} 300 ${CX + 6} 298 L ${CX + 6} 245 Q ${CX + 22} 240 ${CX + 40} 245 Z`,

    // Hamstrings (thick back thigh)
    hamstrings_l: `M ${CX - 40} 305 Q ${CX - 44} 350 ${CX - 40} 400 L ${CX - 6} 400 L ${CX - 6} 305 Z`,
    hamstrings_r: `M ${CX + 6} 305 L ${CX + 6} 400 L ${CX + 40} 400 Q ${CX + 44} 350 ${CX + 40} 305 Z`,

    // Calves back (diamond)
    calves_l: `M ${CX - 36} 405 Q ${CX - 40} 440 ${CX - 36} 480 L ${CX - 12} 480 Q ${CX - 10} 440 ${CX - 10} 405 Z`,
    calves_r: `M ${CX + 10} 405 Q ${CX + 10} 440 ${CX + 12} 480 L ${CX + 36} 480 Q ${CX + 40} 440 ${CX + 36} 405 Z`,
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
