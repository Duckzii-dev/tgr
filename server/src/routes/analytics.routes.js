import { Router } from 'express';
import * as c from '../controllers/analytics.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/overview', asyncHandler(c.analyticsOverview));
r.get('/streak', asyncHandler(c.streak));
r.get('/exercise/:exerciseId/progression', asyncHandler(c.exerciseProgression));

export default r;