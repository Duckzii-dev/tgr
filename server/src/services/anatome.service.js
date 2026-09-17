import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXERCISES_FILE = path.join(
  __dirname, '..', '..', 'public', 'anatome-exercises.json'
);
const MAPS_DIR = path.join(__dirname, '..', '..', 'public', 'muscle-maps');

let _cache = null;
const _svgCache = new Map();

export async function loadAnatomeExercises() {
  if (_cache) return _cache;
  try {
    const raw = await fs.readFile(EXERCISES_FILE, 'utf8');
    const data = JSON.parse(raw);
    _cache = {
      meta: data._meta || {},
      exercises: data.exercises || [],
    };
  } catch {
    _cache = { meta: {}, exercises: [] };
  }
  return _cache;
}

export async function searchLocalExercises(query, opts = {}) {
  const { exercises } = await loadAnatomeExercises();
  const {
    bodyPart, equipment, muscleSlug, difficulty, category,
    limit = 50, offset = 0,
  } = opts;

  const q = String(query || '').toLowerCase().trim();

  const filtered = exercises.filter((e) => {
    if (q) {
      const haystack = [
        e.name,
        ...(e.primaryMuscles || []),
        ...(e.secondaryMuscles || []),
        ...(e.keywords || []),
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (bodyPart && !(e.primaryMuscles || []).includes(bodyPart)) return false;
    if (muscleSlug && !(e.muscleSlugs || []).includes(muscleSlug)) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (difficulty && e.difficulty !== difficulty) return false;
    if (category && e.category !== category) return false;
    return true;
  });

  const total = filtered.length;
  const sliced = filtered.slice(offset, offset + limit);

  return { exercises: sliced, total };
}

export async function getLocalExercise(id) {
  const { exercises } = await loadAnatomeExercises();
  return exercises.find((e) => e.id === id) || null;
}

export async function listFacets() {
  const { exercises } = await loadAnatomeExercises();
  const bodyParts = new Set();
  const equipments = new Set();
  const difficulties = new Set();
  const categories = new Set();
  const muscleSlugs = new Set();

  for (const e of exercises) {
    for (const m of e.primaryMuscles || []) bodyParts.add(m);
    for (const m of e.muscleSlugs || []) muscleSlugs.add(m);
    if (e.equipment) equipments.add(e.equipment);
    if (e.difficulty) difficulties.add(e.difficulty);
    if (e.category) categories.add(e.category);
  }

  return {
    bodyParts: [...bodyParts].sort(),
    equipments: [...equipments].sort(),
    difficulties: [...difficulties].sort(),
    categories: [...categories].sort(),
    muscleSlugs: [...muscleSlugs].sort(),
    total: exercises.length,
  };
}

/**
 * Đọc SVG content từ local file.
 * Cache trong memory.
 */
export async function getSvgContent(exerciseId) {
  if (_svgCache.has(exerciseId)) {
    return _svgCache.get(exerciseId);
  }

  try {
    const filePath = path.join(MAPS_DIR, `${exerciseId}.svg`);
    const content = await fs.readFile(filePath, 'utf8');
    _svgCache.set(exerciseId, content);
    return content;
  } catch {
    return null;
  }
}

/**
 * Inline SVG vào response — thay vì URL, trả thẳng SVG string.
 */
export async function getExerciseWithSvg(id) {
  const ex = await getLocalExercise(id);
  if (!ex) return null;

  const svg = await getSvgContent(id);
  return {
    ...ex,
    svg,        // inline SVG
    svgPath: `/static/muscle-maps/${id}.svg`,
  };
}
