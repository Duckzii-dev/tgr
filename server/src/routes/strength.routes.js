import { Router } from 'express';
import * as c from '../controllers/strength.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/levels', asyncHandler(c.listAllLevels));
r.get('/level/:exerciseId', asyncHandler(c.getExerciseLevel));

export default r;