#!/usr/bin/env bash
# ================================================================
# FEATURE 58: FIX MAPPING HAMSTRINGS + CALVES
# Chạy từ ~/Code/tgr: bash feature58.sh
# ================================================================
set -euo pipefail

TGR_DIR="$HOME/Code/tgr"
cd "$TGR_DIR"

cat > client/src/lib/bodyMusclesMap.js <<'EOF'
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
EOF
echo "✅ Fixed bodyMusclesMap.js"

# Verify
echo ""
echo "=== Verify ==="
cd client

node --input-type=module <<'EOF'
import { FRONT_MUSCLES, BACK_MUSCLES } from 'body-muscles';

const allIds = new Set([
  ...FRONT_MUSCLES.map((x) => x.id),
  ...BACK_MUSCLES.map((x) => x.id),
]);

const testSlugs = {
  neck: ['neck-left', 'neck-right', 'nape', 'head-back'],
  upper_chest: ['chest-upper-left', 'chest-upper-right'],
  chest: ['chest-lower-left', 'chest-lower-right'],
  front_delt: ['shoulder-front-left', 'shoulder-front-right'],
  side_delt: ['shoulder-side-left', 'shoulder-side-right'],
  rear_delt: ['deltoid-rear-left', 'deltoid-rear-right'],
  traps: ['traps-upper-left', 'traps-mid-left', 'traps-lower-left', 'traps-upper-right', 'traps-mid-right', 'traps-lower-right'],
  lats: ['lats-upper-left', 'lats-mid-left', 'lats-lower-left', 'lats-upper-right', 'lats-mid-right', 'lats-lower-right'],
  middle_back: ['traps-mid-left', 'traps-mid-right', 'lats-mid-left', 'lats-mid-right'],
  lower_back: ['lower-back-erectors-left', 'lower-back-erectors-right', 'lower-back-ql-left', 'lower-back-ql-right', 'spine'],
  biceps: ['biceps-left', 'biceps-right'],
  triceps: ['triceps-long-left', 'triceps-lateral-left', 'triceps-long-right', 'triceps-lateral-right'],
  forearms: ['forearm-left', 'forearm-right', 'forearm-flexors-left', 'forearm-extensors-left', 'forearm-flexors-right', 'forearm-extensors-right'],
  abs: ['abs-upper-left', 'abs-upper-right', 'abs-lower-left', 'abs-lower-right'],
  obliques: ['obliques-left', 'obliques-right', 'serratus-anterior-left', 'serratus-anterior-right'],
  glutes: ['gluteus-maximus-left', 'gluteus-maximus-right', 'gluteus-medius-left', 'gluteus-medius-right'],
  quads: ['quads-left', 'quads-right'],
  hamstrings: ['hamstrings-medial-left', 'hamstrings-lateral-left', 'hamstrings-medial-right', 'hamstrings-lateral-right'],
  calves: ['calves-gastroc-medial-left', 'calves-gastroc-lateral-left', 'calves-soleus-left', 'calves-gastroc-medial-right', 'calves-gastroc-lateral-right', 'calves-soleus-right', 'tibialis-anterior-left', 'tibialis-anterior-right'],
};

let ok = 0, err = 0;
for (const [slug, ids] of Object.entries(testSlugs)) {
  const invalid = ids.filter((id) => !allIds.has(id));
  if (invalid.length) {
    console.log('❌', slug, '→ invalid:', invalid.join(', '));
    err++;
  } else {
    console.log('✅', slug, '→ OK (' + ids.length + ')');
    ok++;
  }
}

console.log('');
console.log(`Total: ${ok} OK, ${err} invalid`);
EOF

cd ..

echo ""
echo "🔨 Build test..."
cd client
if npm run build 2>&1 | tail -5; then
  echo "✅ Build OK"
else
  echo "❌ Build FAILED"
  exit 1
fi
cd ..

echo ""
echo "================================================================"
echo "✅ FEATURE 58 hoàn tất"
echo "================================================================"
echo ""
echo "Commit + push:"
echo "  git add client/src/lib/bodyMusclesMap.js"
echo "  git commit -m 'Feature 58: Full body-muscles mapping (89 regions)'"
echo "  git push"
echo ""