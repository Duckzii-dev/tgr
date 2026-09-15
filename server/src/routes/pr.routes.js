import { Router } from 'express';
import * as c from '../controllers/pr.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listPRs));
r.get('/recent', asyncHandler(c.recentPRs));
r.get('/best', asyncHandler(c.bestByExercise));

export default r;