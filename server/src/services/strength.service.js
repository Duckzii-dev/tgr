import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STANDARDS_FILE = path.join(__dirname, '..', '..', 'public', 'strength-standards.json');

let _cache = null;

export async function loadStandards() {
  if (_cache) return _cache;
  const raw = await fs.readFile(STANDARDS_FILE, 'utf8');
  _cache = JSON.parse(raw);
  return _cache;
}

const LEVELS = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];

const LEVEL_LABELS = {
  beginner: 'Beginner',
  novice: 'Novice',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  elite: 'Elite',
  untrained: 'Untrained',
};

/**
 * Normalize exercise name để match với standards.
 * Bench Press (barbell) → Bench Press
 */
function normalizeName(name) {
  return String(name || '').trim();
}

/**
 * Tìm standards cho exercise. Trả về null nếu không có trong bảng.
 */
export async function findStandards(exerciseName) {
  const standards = await loadStandards();
  const normalized = normalizeName(exerciseName);

  for (const gender of ['male', 'female']) {
    if (standards[gender]?.[normalized]) {
      return {
        male: standards.male?.[normalized] || null,
        female: standards.female?.[normalized] || null,
      };
    }
  }

  // fallback: search case-insensitive
  for (const gender of ['male', 'female']) {
    const keys = Object.keys(standards[gender] || {});
    const match = keys.find(
      (k) => k.toLowerCase() === normalized.toLowerCase()
    );
    if (match) {
      return {
        male: standards.male?.[match] || null,
        female: standards.female?.[match] || null,
      };
    }
  }

  return null;
}

/**
 * Xác định level dựa trên ratio và standards.
 */
export function levelFromRatio(ratio, genderStandards) {
  if (!genderStandards) return null;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const level = LEVELS[i];
    if (ratio >= genderStandards[level]) {
      return level;
    }
  }
  return 'untrained';
}

/**
 * Trả về level tiếp theo + target 1RM.
 */
export function nextLevelInfo(currentLevel, genderStandards, bodyweight) {
  if (!genderStandards || !bodyweight) return null;
  const currentIdx = LEVELS.indexOf(currentLevel);
  const nextIdx = currentIdx + 1;
  if (nextIdx >= LEVELS.length) return null;
  const nextLevel = LEVELS[nextIdx];
  const targetRatio = genderStandards[nextLevel];
  return {
    level: nextLevel,
    label: LEVEL_LABELS[nextLevel],
    targetRatio,
    target1RM: +(targetRatio * bodyweight).toFixed(1),
  };
}

export function levelLabel(level) {
  return LEVEL_LABELS[level] || level;
}

export { LEVELS, LEVEL_LABELS };