import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSCLE_MAP_FILE = path.join(
  __dirname, '..', '..', 'public', 'exercise-muscles.json'
);

let _cache = null;

export async function loadMuscleMap() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(MUSCLE_MAP_FILE, 'utf8');
    _cache = JSON.parse(raw);
  } catch {
    _cache = {};
  }
  return _cache;
}

/**
 * Convert muscle slug từ bất kỳ format nào → snake_case chuẩn.
 *   'upper-chest' → 'upper_chest'
 *   'upperChest'  → 'upper_chest'
 *   'upper chest' → 'upper_chest'
 *   'chest'       → 'chest'
 *   'quadriceps'  → 'quads'
 */
export function normalizeSlug(slug) {
  if (!slug) return null;
  let s = String(slug).trim().toLowerCase();

  // Replace separators
  s = s.replace(/[\s\-]+/g, '_');

  // Aliases
  const aliases = {
    // Chest
    upperchest: 'upper_chest',
    upper_chest: 'upper_chest',
    chest: 'chest',
    mid_chest: 'chest',
    lower_chest: 'chest',
    pectorals: 'chest',
    pecs: 'chest',

    // Shoulders
    front_delts: 'front_delt',
    anterior_delts: 'front_delt',
    front_delt: 'front_delt',
    side_delts: 'side_delt',
    lateral_delts: 'side_delt',
    side_delt: 'side_delt',
    rear_delts: 'rear_delt',
    posterior_delts: 'rear_delt',
    rear_delt: 'rear_delt',
    shoulders: 'side_delt',
    delts: 'side_delt',
    deltoids: 'side_delt',

    // Back
    lats: 'lats',
    latissimus: 'lats',
    lat: 'lats',
    traps: 'traps',
    trapezius: 'traps',
    upper_traps: 'traps',
    mid_traps: 'traps',
    middle_back: 'middle_back',
    rhomboids: 'middle_back',
    lower_back: 'lower_back',
    erectors: 'lower_back',
    erector_spinae: 'lower_back',
    spine: 'lower_back',
    back: 'lats',

    // Arms
    bicep: 'biceps',
    biceps: 'biceps',
    tricep: 'triceps',
    triceps: 'triceps',
    forearms: 'forearms',
    forearm: 'forearms',
    brachialis: 'biceps',

    // Core
    abs: 'abs',
    abdominals: 'abs',
    core: 'abs',
    obliques: 'obliques',
    obliques_: 'obliques',

    // Legs
    quads: 'quads',
    quadriceps: 'quads',
    quad: 'quads',
    hamstrings: 'hamstrings',
    hamstring: 'hamstrings',
    hams: 'hamstrings',
    glutes: 'glutes',
    gluteus_maximus: 'glutes',
    glute: 'glutes',
    calves: 'calves',
    calf: 'calves',
    gastrocnemius: 'calves',
    soleus: 'calves',
    tibialis: 'calves',
    adductors: 'quads',
    abductors: 'glutes',
    hip_flexors: 'quads',

    // Neck
    neck: 'neck',
    traps_neck: 'neck',

    // Cardio
    cardio: 'cardio',
  };

  return aliases[s] || s;
}

/**
 * Lấy contributions cho exercise.
 *
 * Priority:
 *   1. custom muscleSlugs (JSON array trong DB)
 *   2. lookup theo name trong exercise-muscles.json
 *   3. muscleGroup fallback
 */
export async function getMuscleContributions(exercise) {
  // ============ 1. Custom muscleSlugs ============
  if (Array.isArray(exercise.muscleSlugs) && exercise.muscleSlugs.length > 0) {
    const contrib = {};
    for (const rawSlug of exercise.muscleSlugs) {
      const normalized = normalizeSlug(rawSlug);
      if (!normalized) continue;
      contrib[normalized] = 1.0;
    }
    if (Object.keys(contrib).length > 0) return contrib;
  }

  // ============ 2. Lookup by name ============
  const map = await loadMuscleMap();

  // Exact match
  if (map[exercise.name]) {
    return normalizeContributions(map[exercise.name]);
  }

  // Fuzzy match
  const nameLower = exercise.name.toLowerCase();
  for (const [key, val] of Object.entries(map)) {
    const keyLower = key.toLowerCase();
    if (nameLower.includes(keyLower) || keyLower.includes(nameLower)) {
      return normalizeContributions(val);
    }
  }

  // ============ 3. muscleGroup fallback ============
  const g = normalizeSlug(exercise.muscleGroup || 'other');
  return { [g]: 1.0 };
}

/**
 * Normalize keys của contributions map.
 */
function normalizeContributions(raw) {
  const out = {};
  for (const [slug, weight] of Object.entries(raw)) {
    const norm = normalizeSlug(slug);
    if (!norm) continue;
    out[norm] = (out[norm] || 0) + weight;
  }
  return out;
}

export const MUSCLE_GROUPS_DETAILED = [
  'neck', 'traps',
  'front_delt', 'side_delt', 'rear_delt',
  'upper_chest', 'chest',
  'lats', 'middle_back', 'lower_back',
  'biceps', 'triceps', 'forearms',
  'abs', 'obliques',
  'glutes', 'quads', 'hamstrings', 'calves',
  'cardio',
];

export const MUSCLE_GROUP_LABELS = {
  neck: 'Neck', traps: 'Traps',
  front_delt: 'Front Delt', side_delt: 'Side Delt', rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest', chest: 'Chest',
  lats: 'Lats', middle_back: 'Middle Back', lower_back: 'Lower Back',
  biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  abs: 'Abs', obliques: 'Obliques',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
  cardio: 'Cardio',
};

export function labelFor(mg) {
  return MUSCLE_GROUP_LABELS[mg] || mg;
}

export const RECOVERY_HALF_LIFE = {
  chest: 60, upper_chest: 60,
  lats: 60, middle_back: 60, lower_back: 72,
  quads: 66, hamstrings: 66, glutes: 60, traps: 48,
  front_delt: 42, side_delt: 40, rear_delt: 40,
  biceps: 40, triceps: 40,
  forearms: 30, calves: 36,
  abs: 30, obliques: 30,
  neck: 24,
  cardio: 24,
};

export function halfLifeFor(muscleGroup) {
  return RECOVERY_HALF_LIFE[muscleGroup] || 48;
}

export const RECOVERY_HOURS = RECOVERY_HALF_LIFE;

export function recoveryPercent(hoursSince, halfLife) {
  if (hoursSince <= 0) return 0;
  if (!halfLife || halfLife <= 0) return 100;
  const recovery = 1 - Math.exp(-hoursSince / halfLife);
  return Math.round(recovery * 1000) / 10;
}

export function recoveryStatus(percent, neverTrained) {
  if (neverTrained) return { status: 'never', label: 'Never trained', color: '#5a6470' };
  if (percent >= 90) return { status: 'fresh', label: 'Fresh', color: '#c6ff3d' };
  if (percent >= 70) return { status: 'cooled', label: 'Cooled', color: '#ffb038' };
  if (percent >= 40) return { status: 'recovering', label: 'Recovering', color: '#ff8f3d' };
  if (percent >= 15) return { status: 'fatigued', label: 'Fatigued', color: '#ff5e5e' };
  return { status: 'cooked', label: 'Cooked', color: '#8a1f1f' };
}
