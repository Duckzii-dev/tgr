import { Router } from 'express';
import * as c from '../controllers/anatome.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/exercises', asyncHandler(c.searchExercises));
r.get('/exercises/:id', asyncHandler(c.getExercise));
r.get('/facets', asyncHandler(c.facets));
r.get('/meta', asyncHandler(c.meta));

export default r;
