import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import bodyWeightRoutes from './routes/bodyweight.routes.js';
import prRoutes from './routes/pr.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import goalRoutes from './routes/goal.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';
import strengthRoutes from './routes/strength.routes.js';
import landmarkRoutes from './routes/landmark.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { issueCsrfToken, verifyCsrf } from './middleware/csrf.middleware.js';
import { ipBlockGuard, getClientIp } from './middleware/ipblock.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://challenges.cloudflare.com",
          "https://*.cloudflare.com",
        ],
        scriptSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "https://challenges.cloudflare.com",
          "https://*.cloudflare.com",
        ],
        frameSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://*.cloudflare.com",
        ],
        connectSrc: [
          "'self'",
          "https://challenges.cloudflare.com",
          "https://*.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        mediaSrc: ["'self'", "data:", "blob:", "https:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", "data:", "https:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        workerSrc: ["'self'", "blob:"],
      },
    },
  })
);

app.use(
  cors({
    origin: IS_PROD ? false : process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use(
  '/static',
  express.static(path.join(__dirname, '../public'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

app.use('/api', ipBlockGuard);

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
});
app.use('/api', globalLimiter);

app.use(issueCsrfToken);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', verifyCsrf, adminRoutes);
app.use('/api/workouts', verifyCsrf, workoutRoutes);
app.use('/api/exercises', verifyCsrf, exerciseRoutes);
app.use('/api/bodyweight', verifyCsrf, bodyWeightRoutes);
app.use('/api/prs', verifyCsrf, prRoutes);
app.use('/api/calendar', verifyCsrf, calendarRoutes);
app.use('/api/analytics', verifyCsrf, analyticsRoutes);
app.use('/api/goals', verifyCsrf, goalRoutes);
app.use('/api/profile', verifyCsrf, profileRoutes);
app.use('/api/strength', verifyCsrf, strengthRoutes);
app.use('/api/landmarks', verifyCsrf, landmarkRoutes);

const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.setHeader('Cache-Control', 'no-store, must-revalidate');
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[tgr] server listening on :${PORT}`);
  console.log(`[tgr] serving client from ${clientDist}`);
});
