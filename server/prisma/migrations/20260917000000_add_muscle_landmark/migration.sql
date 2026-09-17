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
