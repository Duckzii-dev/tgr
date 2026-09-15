import { Router } from 'express';
import * as c from '../controllers/bodyweight.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listBodyWeight));
r.get('/stats', asyncHandler(c.bodyWeightStats));
r.post('/', asyncHandler(c.createBodyWeight));
r.put('/:id', asyncHandler(c.updateBodyWeight));
r.delete('/:id', asyncHandler(c.deleteBodyWeight));

export default r;