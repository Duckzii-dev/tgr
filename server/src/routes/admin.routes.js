import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/admin.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import { getClientIp } from '../middleware/ipblock.middleware.js';

const r = Router();

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many admin requests' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});

r.use(requireAuth, adminLimiter, requireAdmin);

// dashboard
r.get('/stats', asyncHandler(c.stats));

// users
r.get('/users', asyncHandler(c.listUsers));
r.get('/users/:id', asyncHandler(c.getUser));
r.post('/users/:id/ban', asyncHandler(c.banUser));
r.post('/users/:id/unban', asyncHandler(c.unbanUser));
r.put('/users/:id/role', asyncHandler(c.setRole));
r.delete('/users/:id', asyncHandler(c.deleteUser));
r.post('/users/:id/block-ip', asyncHandler(c.blockUserLastIp));

// ip blocks
r.get('/blocks', asyncHandler(c.listBlocks));
r.post('/blocks', asyncHandler(c.createBlock));
r.delete('/blocks/:id', asyncHandler(c.deleteBlock));

// audit
r.get('/audit', asyncHandler(c.listAudit));

export default r;