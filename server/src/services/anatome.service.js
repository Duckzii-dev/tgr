import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXERCISES_FILE = path.join(
  __dirname, '..', '..', 'public', 'anatome-exercises.json'
);

let _cache = null;

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
        ...(e.keywords || []),
        ...(e.primaryMuscles || []),
        ...(e.secondaryMuscles || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (bodyPart && e.bodyPart !== bodyPart) return false;
    if (equipment && e.equipment !== equipment) return false;
    if (difficulty && e.difficulty !== difficulty) return false;
    if (category && e.category !== category) return false;
    if (muscleSlug && !(e.muscleSlugs || []).includes(muscleSlug)) return false;
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
    if (e.bodyPart) bodyParts.add(e.bodyPart);
    if (e.equipment) equipments.add(e.equipment);
    if (e.difficulty) difficulties.add(e.difficulty);
    if (e.category) categories.add(e.category);
    for (const m of e.muscleSlugs || []) muscleSlugs.add(m);
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
