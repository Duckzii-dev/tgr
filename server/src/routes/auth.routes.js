import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

r.post('/register', authLimiter, asyncHandler(c.register));
r.post('/login', authLimiter, asyncHandler(c.login));
r.get('/me', requireAuth, asyncHandler(c.me));
r.post('/logout', asyncHandler(c.logout));

r.get('/google', asyncHandler(c.googleStart));
r.get('/google/callback', asyncHandler(c.googleCallback));
r.post('/google/unlink', requireAuth, asyncHandler(c.unlinkGoogle));

export default r;