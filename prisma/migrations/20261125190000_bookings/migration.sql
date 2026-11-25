-- CreateTable
CREATE TABLE `Booking` (
    `id` CHAR(36) NOT NULL,
    `ref` VARCHAR(16) NOT NULL,
    `serviceSlug` VARCHAR(80) NOT NULL,
    `serviceTitle` VARCHAR(191) NOT NULL,
    `yacht` VARCHAR(191) NOT NULL DEFAULT '',
    `name` VARCHAR(80) NOT NULL,
    `email` VARCHAR(160) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(5) NOT NULL,
    `hours` INTEGER NOT NULL,
    `guests` INTEGER NOT NULL,
    `message` VARCHAR(1000) NOT NULL DEFAULT '',
    `status` ENUM('NEW', 'CONFIRMED', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'NEW',
    `note` VARCHAR(1000) NOT NULL DEFAULT '',
    `ip` VARCHAR(64) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booking_ref_key`(`ref`),
    INDEX `Booking_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Booking_createdAt_idx`(`createdAt`),
    INDEX `Booking_ip_createdAt_idx`(`ip`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
