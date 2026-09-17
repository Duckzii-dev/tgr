import { Router } from 'express';
import * as c from '../controllers/musclemap.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listMaps));
r.get('/:id/exists', asyncHandler(c.hasMap));

export default r;
