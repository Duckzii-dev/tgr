import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import bodyWeightRoutes from './routes/bodyweight.routes.js';
import prRoutes from './routes/pr.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import goalRoutes from './routes/goal.routes.js';
import profileRoutes from './routes/profile.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { issueCsrfToken, verifyCsrf } from './middleware/csrf.middleware.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Trust proxy (Railway/Cloudflare) — phải đặt trước mọi middleware đọc req.ip
app.set('trust proxy', 1);

// Security headers
app.use(helmet({ crossOriginResourcePolicy: false }));

// CORS — dùng CLIENT_URL, mặc định localhost dev
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Body + cookie + log
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Global rate limit: 300 req / phút / IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.ip,
});

app.use('/api', globalLimiter);

// CSRF token issue (cho mọi request — set cookie nếu chưa có)
app.use(issueCsrfToken);

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Auth routes — KHÔNG cần CSRF (login/register chưa có session)
app.use('/api/auth', authRoutes);

// Các route state-changing — verify CSRF
app.use('/api/workouts', verifyCsrf, workoutRoutes);
app.use('/api/exercises', verifyCsrf, exerciseRoutes);
app.use('/api/bodyweight', verifyCsrf, bodyWeightRoutes);
app.use('/api/prs', verifyCsrf, prRoutes);
app.use('/api/calendar', verifyCsrf, calendarRoutes);
app.use('/api/analytics', verifyCsrf, analyticsRoutes);
app.use('/api/goals', verifyCsrf, goalRoutes);
app.use('/api/profile', verifyCsrf, profileRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[tgr] server listening on :${PORT}`);
});