-- ============================================================
-- Migration: add admin role, ban fields, IpBlock, AuditLog
-- Date: 2026-09-16
-- ============================================================

-- 1. User: role + ban + login tracking
ALTER TABLE `User`
  ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'user',
  ADD COLUMN `isBanned` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `bannedAt` DATETIME(3) NULL,
  ADD COLUMN `bannedReason` TEXT NULL,
  ADD COLUMN `lastLoginAt` DATETIME(3) NULL,
  ADD COLUMN `lastLoginIp` VARCHAR(191) NULL;

CREATE INDEX `User_role_idx` ON `User`(`role`);
CREATE INDEX `User_isBanned_idx` ON `User`(`isBanned`);

-- 2. IpBlock
CREATE TABLE `IpBlock` (
    `id` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NOT NULL,
    `reason` TEXT NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NULL,

    UNIQUE INDEX `IpBlock_ip_key`(`ip`),
    INDEX `IpBlock_ip_idx`(`ip`),
    INDEX `IpBlock_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. AuditLog
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `actorId` VARCHAR(191) NULL,
    `actorEmail` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` VARCHAR(191) NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_actorId_idx`(`actorId`),
    INDEX `AuditLog_targetId_idx`(`targetId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. FK
ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AuditLog`
  ADD CONSTRAINT `AuditLog_targetId_fkey`
    FOREIGN KEY (`targetId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;