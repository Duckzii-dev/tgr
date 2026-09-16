-- ============================================================
-- Migration: add finishedAt, timezone, PersonalRecord.workoutId
-- Date: 2026-09-16
-- ============================================================

-- 1. Workout.finishedAt
ALTER TABLE `Workout`
  ADD COLUMN `finishedAt` DATETIME(3) NULL;

CREATE INDEX `Workout_finishedAt_idx` ON `Workout`(`finishedAt`);

-- 2. User.timezone
ALTER TABLE `User`
  ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'UTC';

-- 3. PersonalRecord.workoutId
ALTER TABLE `PersonalRecord`
  ADD COLUMN `workoutId` VARCHAR(191) NULL;

ALTER TABLE `PersonalRecord`
  ADD CONSTRAINT `PersonalRecord_workoutId_fkey`
  FOREIGN KEY (`workoutId`) REFERENCES `Workout`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `PersonalRecord_workoutId_idx` ON `PersonalRecord`(`workoutId`);

-- 4. Unique per (user, exercise, type)
CREATE UNIQUE INDEX `PersonalRecord_userId_exerciseId_type_key`
  ON `PersonalRecord`(`userId`, `exerciseId`, `type`);