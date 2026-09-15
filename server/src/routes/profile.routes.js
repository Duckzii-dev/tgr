import { Router } from 'express';
import * as c from '../controllers/profile.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.getProfile));
r.put('/', asyncHandler(c.updateProfile));
r.put('/password', asyncHandler(c.changePassword));
r.get('/schedule', asyncHandler(c.getSchedule));
r.post('/schedule', asyncHandler(c.setSchedule));

export default r;