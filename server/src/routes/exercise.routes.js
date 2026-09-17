import { Router } from 'express';
import * as c from '../controllers/exercise.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/facets', asyncHandler(c.facets));
r.get('/', asyncHandler(c.listExercises));
r.post('/', asyncHandler(c.createExercise));
r.get('/:id', asyncHandler(c.getExercise));
r.delete('/:id', asyncHandler(c.deleteExercise));

export default r;
