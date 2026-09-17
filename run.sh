#!/usr/bin/env bash
# ================================================================
# FEATURE 7: VOLUME LANDMARKS (MEV / MAV / MRV)
# Tự động tạo/sửa tất cả file
# Chạy từ root repo: bash feature7-landmarks.sh
# ================================================================
set -euo pipefail

ROOT="$(pwd)"
echo "📁 Root: $ROOT"

# ============================================================
# 1. Migration: thêm bảng MuscleLandmark
# ============================================================
mkdir -p server/prisma/migrations/20260917000000_add_muscle_landmark
cat > server/prisma/migrations/20260917000000_add_muscle_landmark/migration.sql <<'EOF'
-- ============================================================
-- Migration: add MuscleLandmark for volume landmarks per user
-- Date: 2026-09-17
-- ============================================================

CREATE TABLE `MuscleLandmark` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `muscleGroup` VARCHAR(191) NOT NULL,
    `mev` INT NULL,
    `mav` INT NULL,
    `mrv` INT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MuscleLandmark_userId_muscleGroup_key`(`userId`, `muscleGroup`),
    INDEX `MuscleLandmark_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MuscleLandmark`
  ADD CONSTRAINT `MuscleLandmark_userId_fkey`
    FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
EOF
echo "✅ server/prisma/migrations/20260917000000_add_muscle_landmark/migration.sql"

# ============================================================
# 2. schema.prisma
# ============================================================
cat > server/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  name          String?
  googleId      String?   @unique
  emailVerified Boolean   @default(false)
  avatarUrl     String?
  timezone      String    @default("UTC")
  role          String    @default("user")
  isBanned      Boolean   @default(false)
  bannedAt      DateTime?
  bannedReason  String?   @db.Text
  lastLoginAt   DateTime?
  lastLoginIp   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  workouts          Workout[]
  bodyWeights       BodyWeight[]
  trainingSchedules TrainingSchedule[]
  goals             Goal[]
  personalRecords   PersonalRecord[]
  exercises         Exercise[]
  auditLogs         AuditLog[]        @relation("AuditActor")
  auditTargets      AuditLog[]        @relation("AuditTarget")
  muscleLandmarks   MuscleLandmark[]

  @@index([email])
  @@index([googleId])
  @@index([role])
  @@index([isBanned])
}

model Exercise {
  id          String   @id @default(cuid())
  name        String
  muscleGroup String
  equipment   String?
  isCustom    Boolean  @default(false)
  userId      String?
  createdAt   DateTime @default(now())

  externalId         String?  @unique
  imageUrl           String?
  imageUrls          Json?
  videoUrl           String?
  bodyParts          Json?
  targetMuscles      Json?
  secondaryMuscles   Json?
  equipments         Json?
  exerciseType       String?
  overview           String?  @db.Text
  instructions       Json?
  exerciseTips       Json?
  variations         Json?
  keywords           Json?
  relatedExerciseIds Json?

  user             User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]
  personalRecords  PersonalRecord[]

  @@unique([userId, name])
  @@index([userId])
  @@index([muscleGroup])
  @@index([externalId])
}

model Workout {
  id          String    @id @default(cuid())
  name        String
  date        DateTime
  startTime   DateTime?
  endTime     DateTime?
  finishedAt  DateTime?
  duration    Int?
  notes       String?   @db.Text
  workoutType String    @default("strength")
  userId      String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises WorkoutExercise[]
  prs       PersonalRecord[]

  @@index([userId])
  @@index([date])
  @@index([createdAt])
  @@index([finishedAt])
}

model WorkoutExercise {
  id         String   @id @default(cuid())
  workoutId  String
  exerciseId String
  order      Int      @default(0)
  notes      String?  @db.Text
  createdAt  DateTime @default(now())

  workout  Workout      @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  sets     WorkoutSet[]

  @@index([workoutId])
  @@index([exerciseId])
}

model WorkoutSet {
  id                String   @id @default(cuid())
  workoutExerciseId String
  setNumber         Int
  weight            Float
  reps              Int
  rir               Int?
  rpe               Float?
  restSeconds       Int?
  estimated1RM      Float?
  isWarmup          Boolean  @default(false)
  completed         Boolean  @default(true)
  createdAt         DateTime @default(now())

  workoutExercise WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@index([workoutExerciseId])
  @@index([createdAt])
}

model BodyWeight {
  id         String   @id @default(cuid())
  userId     String
  weight     Float
  recordedAt DateTime
  notes      String?  @db.Text
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([recordedAt])
}

model TrainingSchedule {
  id          String   @id @default(cuid())
  userId      String
  weekday     Int
  workoutType String
  isPlanned   Boolean  @default(true)
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, weekday])
  @@index([userId])
}

model Goal {
  id         String    @id @default(cuid())
  userId     String
  type       String
  title      String
  target     Float
  current    Float     @default(0)
  unit       String?
  exerciseId String?
  deadline   DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}

model PersonalRecord {
  id         String   @id @default(cuid())
  userId     String
  exerciseId String
  workoutId  String?
  type       String
  value      Float
  reps       Int?
  weight     Float?
  achievedAt DateTime
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  workout  Workout? @relation(fields: [workoutId], references: [id], onDelete: SetNull)

  @@unique([userId, exerciseId, type])
  @@index([userId])
  @@index([exerciseId])
  @@index([achievedAt])
  @@index([workoutId])
}

model IpBlock {
  id        String    @id @default(cuid())
  ip        String    @unique
  reason    String?   @db.Text
  createdBy String?
  createdAt DateTime  @default(now())
  expiresAt DateTime?

  @@index([ip])
  @@index([expiresAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  actorEmail String?
  action     String
  targetType String?
  targetId   String?
  meta       Json?
  ip         String?
  userAgent  String?  @db.Text
  createdAt  DateTime @default(now())

  actor  User? @relation("AuditActor", fields: [actorId], references: [id], onDelete: SetNull)
  target User? @relation("AuditTarget", fields: [targetId], references: [id], onDelete: SetNull)

  @@index([actorId])
  @@index([targetId])
  @@index([action])
  @@index([createdAt])
}

model MuscleLandmark {
  id          String   @id @default(cuid())
  userId      String
  muscleGroup String
  mev         Int?
  mav         Int?
  mrv         Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, muscleGroup])
  @@index([userId])
}
EOF
echo "✅ server/prisma/schema.prisma"

# ============================================================
# 3. server/src/services/landmark.service.js
# ============================================================
mkdir -p server/src/services
cat > server/src/services/landmark.service.js <<'EOF'
export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'cardio',
];

/**
 * Default landmarks (sets per week) cho mỗi muscle group.
 * Tham khảo: RP Strength / Renaissance Periodization.
 */
export const DEFAULT_LANDMARKS = {
  chest: { mev: 8, mav: 14, mrv: 22 },
  back: { mev: 10, mav: 16, mrv: 25 },
  shoulders: { mev: 8, mav: 16, mrv: 26 },
  biceps: { mev: 6, mav: 12, mrv: 20 },
  triceps: { mev: 6, mav: 12, mrv: 20 },
  legs: { mev: 8, mav: 16, mrv: 24 },
  core: { mev: 4, mav: 10, mrv: 16 },
  cardio: { mev: 0, mav: 0, mrv: 0 },
};

export function defaultFor(muscleGroup) {
  return DEFAULT_LANDMARKS[muscleGroup] || { mev: 6, mav: 12, mrv: 20 };
}

/**
 * Phân tích trạng thái so với landmarks.
 * @returns { status: 'under' | 'optimal' | 'high' | 'excessive', label, color }
 */
export function analyzeStatus(currentSets, landmark) {
  const { mev, mav, mrv } = landmark;
  if (mrv == null || mav == null || mev == null) {
    return { status: 'unknown', label: '—', color: '#8a93a0' };
  }
  if (currentSets < mev) {
    return { status: 'under', label: 'Under MEV', color: '#5ed3ff' };
  }
  if (currentSets <= mav) {
    return { status: 'optimal', label: 'Optimal', color: '#c6ff3d' };
  }
  if (currentSets <= mrv) {
    return { status: 'high', label: 'High', color: '#ffb038' };
  }
  return { status: 'excessive', label: 'Above MRV', color: '#ff5e5e' };
}
EOF
echo "✅ server/src/services/landmark.service.js"

# ============================================================
# 4. server/src/controllers/landmark.controller.js
# ============================================================
mkdir -p server/src/controllers
cat > server/src/controllers/landmark.controller.js <<'EOF'
import { prisma } from '../utils/prisma.js';
import { httpError } from '../middleware/error.middleware.js';
import {
  MUSCLE_GROUPS,
  defaultFor,
  analyzeStatus,
} from '../services/landmark.service.js';

/**
 * GET /api/landmarks
 * Trả về landmarks (có override hoặc default) + số set 7 ngày qua mỗi muscle group.
 */
export async function listLandmarks(req, res) {
  const userId = req.user.id;

  // Fetch overrides
  const overrides = await prisma.muscleLandmark.findMany({
    where: { userId },
  });
  const byGroup = {};
  for (const o of overrides) byGroup[o.muscleGroup] = o;

  // Compute sets in last 7 days per muscle group
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const sets = await prisma.workoutSet.findMany({
    where: {
      isWarmup: false,
      workoutExercise: {
        workout: { userId, date: { gte: since } },
      },
    },
    include: {
      workoutExercise: {
        include: {
          exercise: { select: { muscleGroup: true } },
        },
      },
    },
  });

  const sets7d = {};
  for (const g of MUSCLE_GROUPS) sets7d[g] = 0;
  for (const s of sets) {
    const mg = s.workoutExercise.exercise.muscleGroup;
    if (!(mg in sets7d)) sets7d[mg] = 0;
    sets7d[mg] += 1;
  }

  const results = MUSCLE_GROUPS.map((g) => {
    const override = byGroup[g];
    const def = defaultFor(g);
    const landmark = {
      muscleGroup: g,
      mev: override?.mev ?? def.mev,
      mav: override?.mav ?? def.mav,
      mrv: override?.mrv ?? def.mrv,
      isCustom: !!override,
      currentSets: sets7d[g] || 0,
    };
    landmark.status = analyzeStatus(landmark.currentSets, landmark);
    return landmark;
  });

  res.json({ landmarks: results });
}

/**
 * PUT /api/landmarks/:muscleGroup
 * body: { mev?, mav?, mrv? }
 */
export async function upsertLandmark(req, res) {
  const userId = req.user.id;
  const { muscleGroup } = req.params;
  if (!MUSCLE_GROUPS.includes(muscleGroup)) {
    throw httpError(400, 'Invalid muscle group');
  }

  const { mev, mav, mrv } = req.body || {};
  const def = defaultFor(muscleGroup);

  const mevVal = mev != null ? Number(mev) : null;
  const mavVal = mav != null ? Number(mav) : null;
  const mrvVal = mrv != null ? Number(mrv) : null;

  const landmark = await prisma.muscleLandmark.upsert({
    where: {
      userId_muscleGroup: { userId, muscleGroup },
    },
    create: {
      userId,
      muscleGroup,
      mev: mevVal ?? def.mev,
      mav: mavVal ?? def.mav,
      mrv: mrvVal ?? def.mrv,
    },
    update: {
      ...(mevVal != null ? { mev: mevVal } : {}),
      ...(mavVal != null ? { mav: mavVal } : {}),
      ...(mrvVal != null ? { mrv: mrvVal } : {}),
    },
  });

  res.json({ landmark });
}

/**
 * DELETE /api/landmarks/:muscleGroup
 * Reset về default.
 */
export async function resetLandmark(req, res) {
  const userId = req.user.id;
  const { muscleGroup } = req.params;

  await prisma.muscleLandmark.deleteMany({
    where: { userId, muscleGroup },
  });

  res.json({ ok: true });
}
EOF
echo "✅ server/src/controllers/landmark.controller.js"

# ============================================================
# 5. server/src/routes/landmark.routes.js
# ============================================================
mkdir -p server/src/routes
cat > server/src/routes/landmark.routes.js <<'EOF'
import { Router } from 'express';
import * as c from '../controllers/landmark.controller.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const r = Router();
r.use(requireAuth);

r.get('/', asyncHandler(c.listLandmarks));
r.put('/:muscleGroup', asyncHandler(c.upsertLandmark));
r.delete('/:muscleGroup', asyncHandler(c.resetLandmark));

export default r;
EOF
echo "✅ server/src/routes/landmark.routes.js"

# ============================================================
# 6. server/src/index.js (thêm mount landmarks)
# ============================================================
cat > server/src/index.js <<'EOF'
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
EOF
echo "✅ server/src/index.js"

# ============================================================
# 7. client/src/components/VolumeLandmarksCard.jsx
# ============================================================
mkdir -p client/src/components
cat > client/src/components/VolumeLandmarksCard.jsx <<'EOF'
import { useEffect, useState } from 'react';
import { Settings2, RotateCcw, Save, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';

const LABELS = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
};

export default function VolumeLandmarksCard({
  landmarks = [],
  onRefresh,
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // muscleGroup đang sửa
  const [form, setForm] = useState({ mev: '', mav: '', mrv: '' });

  useEffect(() => {
    if (!editing) return;
    const cur = landmarks.find((l) => l.muscleGroup === editing);
    if (cur) {
      setForm({
        mev: cur.mev ?? '',
        mav: cur.mav ?? '',
        mrv: cur.mrv ?? '',
      });
    }
  }, [editing, landmarks]);

  const save = async () => {
    try {
      await api.put(`/landmarks/${editing}`, {
        mev: form.mev !== '' ? Number(form.mev) : null,
        mav: form.mav !== '' ? Number(form.mav) : null,
        mrv: form.mrv !== '' ? Number(form.mrv) : null,
      });
      toast('Saved');
      setEditing(null);
      onRefresh?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const reset = async () => {
    try {
      await api.del(`/landmarks/${editing}`);
      toast('Reset to default');
      setEditing(null);
      onRefresh?.();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const groups = landmarks.filter((l) => l.muscleGroup !== 'cardio');

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-semibold">Volume Landmarks (sets/week)</div>
        <div className="text-xs text-ink-400">
          MEV = min effective · MAV = max adaptive · MRV = max recoverable
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((l) => {
          const max = Math.max(l.mrv || 0, l.currentSets || 0, 1);
          const mevPct = ((l.mev || 0) / max) * 100;
          const mavPct = ((l.mav || 0) / max) * 100;
          const mrvPct = ((l.mrv || 0) / max) * 100;
          const curPct = Math.min(100, ((l.currentSets || 0) / max) * 100);
          const isEditing = editing === l.muscleGroup;

          return (
            <div key={l.muscleGroup} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{LABELS[l.muscleGroup] || l.muscleGroup}</span>
                  {l.isCustom && (
                    <span className="text-[10px] uppercase chip">custom</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: l.status?.color || '#8a93a0' }}
                  >
                    {l.status?.label || '—'}
                  </span>
                  <button
                    className="text-ink-400 hover:text-white"
                    onClick={() => setEditing(isEditing ? null : l.muscleGroup)}
                    title="Edit landmarks"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {!isEditing ? (
                <>
                  <div className="relative h-3 bg-ink-800 rounded-full overflow-hidden">
                    {/* MEV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-blue-400/60"
                      style={{ left: `${mevPct}%` }}
                      title={`MEV ${l.mev}`}
                    />
                    {/* MAV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-accent/60"
                      style={{ left: `${mavPct}%` }}
                      title={`MAV ${l.mav}`}
                    />
                    {/* MRV marker */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400/70"
                      style={{ left: `${mrvPct}%` }}
                      title={`MRV ${l.mrv}`}
                    />
                    {/* Current bar */}
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${curPct}%`,
                        background: l.status?.color || '#c6ff3d',
                        opacity: 0.55,
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-ink-400">
                    <span>
                      MEV {l.mev} · MAV {l.mav} · MRV {l.mrv}
                    </span>
                    <span>
                      Current: <span className="text-white">{l.currentSets}</span> sets
                    </span>
                  </div>
                </>
              ) : (
                <div className="space-y-2 border border-ink-700 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="label">MEV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mev}
                        onChange={(e) => setForm({ ...form, mev: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">MAV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mav}
                        onChange={(e) => setForm({ ...form, mav: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">MRV</label>
                      <input
                        className="input py-1 text-xs"
                        type="number"
                        min="0"
                        value={form.mrv}
                        onChange={(e) => setForm({ ...form, mrv: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn btn-ghost text-xs"
                      onClick={() => setEditing(null)}
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                    <button className="btn btn-ghost text-xs" onClick={reset}>
                      <RotateCcw className="w-3 h-3" /> Default
                    </button>
                    <button className="btn btn-primary text-xs" onClick={save}>
                      <Save className="w-3 h-3" /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
EOF
echo "✅ client/src/components/VolumeLandmarksCard.jsx"

# ============================================================
# 8. client/src/pages/Analytics.jsx (thêm VolumeLandmarksCard)
# ============================================================
cat > client/src/pages/Analytics.jsx <<'EOF'
import { useState } from 'react';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../lib/api.js';
import StatCard from '../components/StatCard.jsx';
import LineChartCard from '../components/LineChartCard.jsx';
import TrainingLoadCard from '../components/TrainingLoadCard.jsx';
import MuscleRecoveryMap from '../components/MuscleRecoveryMap.jsx';
import VolumeLandmarksCard from '../components/VolumeLandmarksCard.jsx';
import Skeleton from '../components/Skeleton.jsx';
import Empty from '../components/Empty.jsx';
import { fmtDuration, fmtNumber } from '../lib/format.js';

export default function Analytics() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data, loading, error, refresh } = useFetch(
    () => {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      return api.get(`/analytics/overview?${p}`);
    },
    [from, to]
  );
  const streak = useFetch(() => api.get('/analytics/streak'), []);
  const landmarks = useFetch(() => api.get('/landmarks'), []);

  const totalGymHours = ((data?.totalDuration || 0) / 3600).toFixed(1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="label">From</label>
          <input
            className="input"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="label">To</label>
          <input
            className="input"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          className="btn btn-ghost self-end"
          onClick={() => {
            setFrom('');
            setTo('');
          }}
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="card p-4 text-red-400 text-sm">
          {error}{' '}
          <button className="underline ml-2" onClick={refresh}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Workouts" value={fmtNumber(data?.totalWorkouts)} />
          <StatCard label="Total Gym Hours" value={totalGymHours} />
          <StatCard label="Avg Session" value={fmtDuration(data?.avgSession)} />
          <StatCard label="Max Session" value={fmtDuration(data?.maxSession)} />
          <StatCard label="Total Sets" value={fmtNumber(data?.totalSets)} />
          <StatCard label="Total Reps" value={fmtNumber(data?.totalReps)} />
          <StatCard
            label="Volume"
            value={`${fmtNumber((data?.totalVolume || 0) / 1000, 1)}t`}
          />
          <StatCard
            label="Streak"
            value={`${streak.data?.current || 0}d`}
            sub={`Longest ${streak.data?.longest || 0}d`}
          />
        </div>
      )}

      {loading ? (
        <Skeleton className="h-56" />
      ) : (
        <MuscleRecoveryMap recovery={data?.recovery || []} />
      )}

      {landmarks.loading ? (
        <Skeleton className="h-56" />
      ) : (
        <VolumeLandmarksCard
          landmarks={landmarks.data?.landmarks || []}
          onRefresh={landmarks.refresh}
        />
      )}

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <TrainingLoadCard
            title="Training Load — by Day of Week"
            data={data?.trainingLoadByDow || []}
            xKey="dow"
            defaultMetric="sets"
          />

          <TrainingLoadCard
            title="Training Load — by Week"
            data={data?.trainingLoadByWeek || []}
            xKey="week"
            defaultMetric="volume"
          />
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="font-semibold mb-2">Weekly Gym Time (hours)</div>
          {data?.weeklyDuration?.length ? (
            <LineChartCard
              data={data.weeklyDuration.map((w) => ({
                week: w.week,
                hours: +(w.seconds / 3600).toFixed(2),
              }))}
              xKey="week"
              lines={[{ key: 'hours', name: 'hours' }]}
            />
          ) : (
            <Empty title="No data" />
          )}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-2">Monthly Gym Time (hours)</div>
          {data?.monthlyDuration?.length ? (
            <LineChartCard
              data={data.monthlyDuration.map((m) => ({
                month: m.month,
                hours: +(m.seconds / 3600).toFixed(2),
              }))}
              xKey="month"
              lines={[{ key: 'hours', name: 'hours', color: '#5ed3ff' }]}
            />
          ) : (
            <Empty title="No data" />
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="font-semibold mb-3">Muscle Group Volume</div>
          {data?.muscleVolume?.length ? (
            <div className="space-y-2">
              {[...data.muscleVolume]
                .sort((a, b) => b.volume - a.volume)
                .map((m) => {
                  const max = Math.max(...data.muscleVolume.map((x) => x.volume));
                  return (
                    <div key={m.muscleGroup}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="capitalize">{m.muscleGroup}</span>
                        <span className="text-ink-400">
                          {fmtNumber(m.volume / 1000, 1)}t
                        </span>
                      </div>
                      <div className="h-2 bg-ink-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(m.volume / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <Empty title="No data" />
          )}
        </div>
        <div className="card p-4">
          <div className="font-semibold mb-3">Exercise Frequency</div>
          {data?.exerciseFrequency?.length ? (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {data.exerciseFrequency.map((e) => (
                <div
                  key={e.name}
                  className="flex justify-between p-2 rounded-lg bg-ink-850 text-sm"
                >
                  <span>{e.name}</span>
                  <span className="text-ink-400">{e.count}×</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="No data" />
          )}
        </div>
      </div>
    </div>
  );
}
EOF
echo "✅ client/src/pages/Analytics.jsx"

echo ""
echo "=============================================="
echo "✅ FEATURE 7 hoàn tất — tất cả file đã ghi"
echo "=============================================="
echo ""
echo "⚠️  CẦN CHẠY MIGRATION TRƯỚC KHI DEPLOY:"
echo "  cd server"
echo "  npx prisma generate"
echo "  npx prisma migrate deploy"
echo ""
echo "Deploy:"
echo "  git add ."
echo "  git commit -m 'Feature 7: Volume Landmarks (MEV/MAV/MRV)'"
echo "  git push"
echo ""