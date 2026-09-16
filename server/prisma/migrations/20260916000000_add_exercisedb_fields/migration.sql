ALTER TABLE `Exercise`
  ADD COLUMN `externalId` VARCHAR(191) NULL,
  ADD COLUMN `imageUrl` VARCHAR(191) NULL,
  ADD COLUMN `imageUrls` JSON NULL,
  ADD COLUMN `videoUrl` VARCHAR(191) NULL,
  ADD COLUMN `bodyParts` JSON NULL,
  ADD COLUMN `targetMuscles` JSON NULL,
  ADD COLUMN `secondaryMuscles` JSON NULL,
  ADD COLUMN `equipments` JSON NULL,
  ADD COLUMN `exerciseType` VARCHAR(191) NULL,
  ADD COLUMN `overview` TEXT NULL,
  ADD COLUMN `instructions` JSON NULL,
  ADD COLUMN `exerciseTips` JSON NULL,
  ADD COLUMN `variations` JSON NULL,
  ADD COLUMN `keywords` JSON NULL,
  ADD COLUMN `relatedExerciseIds` JSON NULL;

CREATE UNIQUE INDEX `Exercise_externalId_key` ON `Exercise`(`externalId`);
CREATE INDEX `Exercise_externalId_idx` ON `Exercise`(`externalId`);
