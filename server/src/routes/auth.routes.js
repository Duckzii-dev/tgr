import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as c from '../controllers/auth.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { verifyTurnstile } from '../middleware/turnstile.middleware.js';
const r = Router();


r.post('/register', registerLimiter, verifyTurnstile, asyncHandler(c.register));
r.post('/login', loginLimiter, verifyTurnstile, asyncHandler(c.login));
// Login: 10 lần / 15 phút / IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Railway proxy: express trust proxy đã set 1 → req.ip đúng
});

// Register: 5 tài khoản / 24 giờ / IP
const registerLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,   // 24h
  max: 5,                           // 5 accounts/day/IP
  message: { error: 'Too many accounts created from this IP. Try again tomorrow.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Nếu có Cloudflare, dùng cf-connecting-ip
    return (
      req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      req.ip
    );
  },
});

r.post('/register', registerLimiter, asyncHandler(c.register));
r.post('/login', loginLimiter, asyncHandler(c.login));
r.get('/me', requireAuth, asyncHandler(c.me));
r.post('/logout', asyncHandler(c.logout));
r.get('/google', asyncHandler(c.googleStart));
r.get('/google/callback', asyncHandler(c.googleCallback));
r.post('/google/unlink', requireAuth, asyncHandler(c.unlinkGoogle));

export default r;