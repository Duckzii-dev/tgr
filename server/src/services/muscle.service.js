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

export async function getMuscleContributions(exercise) {
  const map = await loadMuscleMap();
  if (map[exercise.name]) return map[exercise.name];

  // Fallback: map từ muscleGroup
  const g = exercise.muscleGroup || 'other';
  return { [g]: 1.0 };
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
  neck: 'Neck',
  traps: 'Traps',
  front_delt: 'Front Delt',
  side_delt: 'Side Delt',
  rear_delt: 'Rear Delt',
  upper_chest: 'Upper Chest',
  chest: 'Chest',
  lats: 'Lats',
  middle_back: 'Middle Back',
  lower_back: 'Lower Back',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
};

export function labelFor(mg) {
  return MUSCLE_GROUP_LABELS[mg] || mg;
}

// ============================================================
// HALF-LIFE MODEL
// Đơn vị: giờ
// ============================================================
export const RECOVERY_HALF_LIFE = {
  // Large muscles (48–72h)
  chest: 60,
  upper_chest: 60,
  lats: 60,
  middle_back: 60,
  lower_back: 72,
  quads: 66,
  hamstrings: 66,
  glutes: 60,
  traps: 48,

  // Medium (36–48h)
  front_delt: 42,
  side_delt: 40,
  rear_delt: 40,
  biceps: 40,
  triceps: 40,

  // Small (24–36h)
  forearms: 30,
  calves: 36,
  abs: 30,
  obliques: 30,
  neck: 24,

  // Cardio
  cardio: 24,
};

export function halfLifeFor(muscleGroup) {
  return RECOVERY_HALF_LIFE[muscleGroup] || 48;
}

// Alias để tương thích code cũ
export const RECOVERY_HOURS = RECOVERY_HALF_LIFE;

/**
 * Tính recovery percent dùng exponential decay.
 *
 * @param {number} hoursSince  Số giờ kể từ lần tập cuối
 * @param {number} halfLife    Half-life (giờ) của muscle
 * @returns {number}           0-100 (0=fatigued, 100=fresh)
 */
export function recoveryPercent(hoursSince, halfLife) {
  if (hoursSince <= 0) return 0;
  if (!halfLife || halfLife <= 0) return 100;
  // 1 - e^(-t/hl)
  const recovery = 1 - Math.exp(-hoursSince / halfLife);
  return Math.round(recovery * 1000) / 10; // 1 decimal
}

/**
 * Status label dựa vào recovery percent.
 */
export function recoveryStatus(percent, neverTrained) {
  if (neverTrained) return { status: 'never', label: 'Never trained', color: '#5a6470' };
  if (percent >= 90) return { status: 'fresh', label: 'Fresh', color: '#c6ff3d' };
  if (percent >= 70) return { status: 'cooled', label: 'Cooled', color: '#ffb038' };
  if (percent >= 40) return { status: 'recovering', label: 'Recovering', color: '#ff8f3d' };
  if (percent >= 15) return { status: 'fatigued', label: 'Fatigued', color: '#ff5e5e' };
  return { status: 'cooked', label: 'Cooked', color: '#8a1f1f' };
}
