import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

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

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/bodyweight', bodyWeightRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/profile', profileRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[tgr] server listening on :${PORT}`);
});