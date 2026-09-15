import { Router } from 'express';
import * as c from '../controllers/calendar.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.getCalendar));

export default r;