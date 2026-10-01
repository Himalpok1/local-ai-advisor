CREATE TABLE `rig` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`name` varchar(80) NOT NULL,
	`query` varchar(2048) NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rig_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_item` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`label` varchar(120) NOT NULL,
	`path` varchar(64) NOT NULL,
	`query` varchar(2048) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `saved_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `speed_report` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`hardwareId` varchar(64) NOT NULL,
	`chipKey` varchar(64) NOT NULL,
	`modelId` varchar(128) NOT NULL,
	`quant` varchar(16) NOT NULL,
	`runtimeId` varchar(64) NOT NULL,
	`backend` varchar(16) NOT NULL,
	`os` varchar(16) NOT NULL,
	`contextTokens` int NOT NULL,
	`promptTokens` int NOT NULL,
	`outputTokens` int NOT NULL,
	`generationTps` double NOT NULL,
	`prefillTps` double,
	`notes` varchar(500),
	`status` enum('approved','pending','rejected') NOT NULL,
	`flagReason` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `speed_report_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user` ADD `newModelsSeenAt` timestamp;--> statement-breakpoint
ALTER TABLE `rig` ADD CONSTRAINT `rig_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `saved_item` ADD CONSTRAINT `saved_item_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `speed_report` ADD CONSTRAINT `speed_report_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `rig_user_idx` ON `rig` (`userId`);--> statement-breakpoint
CREATE INDEX `saved_item_user_idx` ON `saved_item` (`userId`);--> statement-breakpoint
CREATE INDEX `speed_report_chip_idx` ON `speed_report` (`chipKey`,`status`);--> statement-breakpoint
CREATE INDEX `speed_report_user_idx` ON `speed_report` (`userId`,`createdAt`);