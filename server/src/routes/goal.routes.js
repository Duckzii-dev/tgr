import { Router } from 'express';
import * as c from '../controllers/goal.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listGoals));
r.post('/', asyncHandler(c.createGoal));
r.put('/:id', asyncHandler(c.updateGoal));
r.delete('/:id', asyncHandler(c.deleteGoal));

export default r;