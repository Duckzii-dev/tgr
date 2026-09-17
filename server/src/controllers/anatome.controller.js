import { httpError } from '../middleware/error.middleware.js';
import {
  searchLocalExercises,
  getLocalExercise,
  listFacets,
  loadAnatomeExercises,
} from '../services/anatome.service.js';

export async function searchExercises(req, res) {
  const { q, bodyPart, equipment, muscleSlug, difficulty, category, limit, offset } = req.query;
  const result = await searchLocalExercises(q, {
    bodyPart: bodyPart || null,
    equipment: equipment || null,
    muscleSlug: muscleSlug || null,
    difficulty: difficulty || null,
    category: category || null,
    limit: limit ? Math.min(200, Number(limit)) : 50,
    offset: offset ? Number(offset) : 0,
  });
  res.json(result);
}

export async function getExercise(req, res) {
  const { id } = req.params;
  const exercise = await getLocalExercise(id);
  if (!exercise) throw httpError(404, 'Exercise not found');
  res.json({ exercise });
}

export async function facets(_req, res) {
  const data = await listFacets();
  res.json(data);
}

export async function meta(_req, res) {
  const { meta, exercises } = await loadAnatomeExercises();
  res.json({ meta, total: exercises.length });
}
