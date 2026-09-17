import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MUSCLE_MAP_FILE = path.join(
  __dirname,
  '..',
  '..',
  'public',
  'exercise-muscles.json'
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
  const g = exercise.muscleGroup || 'other';
  return { [g]: 1.0 };
}

export const MUSCLE_GROUPS_DETAILED = [
  'neck',
  'traps',
  'front_delt',
  'side_delt',
  'rear_delt',
  'upper_chest',
  'chest',
  'lats',
  'middle_back',
  'lower_back',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
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

export const RECOVERY_HOURS = {
  neck: 24,
  traps: 48,
  front_delt: 48,
  side_delt: 48,
  rear_delt: 48,
  upper_chest: 72,
  chest: 72,
  lats: 72,
  middle_back: 72,
  lower_back: 72,
  biceps: 48,
  triceps: 48,
  forearms: 24,
  abs: 24,
  obliques: 24,
  glutes: 72,
  quads: 72,
  hamstrings: 72,
  calves: 48,
  cardio: 24,
};
