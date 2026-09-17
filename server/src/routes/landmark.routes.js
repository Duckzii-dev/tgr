import { Router } from 'express';
import * as c from '../controllers/landmark.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listLandmarks));
r.put('/:muscleGroup', asyncHandler(c.upsertLandmark));
r.delete('/:muscleGroup', asyncHandler(c.resetLandmark));

export default r;
