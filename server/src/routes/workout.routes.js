import { Router } from 'express';
import * as c from '../controllers/workout.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listWorkouts));
r.post('/', asyncHandler(c.createWorkout));

r.post('/bulk-delete', asyncHandler(c.bulkDeleteWorkouts));
r.get('/previous/:exerciseId', asyncHandler(c.previousSession));
r.post('/exercises/:weId/sets', asyncHandler(c.addSet));
r.put('/sets/:setId', asyncHandler(c.updateSet));
r.delete('/sets/:setId', asyncHandler(c.deleteSet));
r.post('/exercises/:weId/duplicate-previous', asyncHandler(c.duplicatePrevious));

r.get('/:id', asyncHandler(c.getWorkout));
r.put('/:id', asyncHandler(c.updateWorkout));
r.delete('/:id', asyncHandler(c.deleteWorkout));
r.post('/:id/finish', asyncHandler(c.finishWorkout));
r.post('/:id/exercises', asyncHandler(c.addExercise));
r.delete('/:id/exercises/:weId', asyncHandler(c.removeExercise));

export default r;