ALTER TABLE `organization_users` RENAME TO `organization_members`;--> statement-breakpoint
CREATE TABLE `organization_invitations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`organization_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`expires_at` integer NOT NULL,
	`inviter_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_organization_members` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`organization_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_organization_members`("id", "created_at", "updated_at", "organization_id", "user_id", "role") SELECT "id", "created_at", "updated_at", "organization_id", "user_id", "role" FROM `organization_members`;--> statement-breakpoint
DROP TABLE `organization_members`;--> statement-breakpoint
ALTER TABLE `__new_organization_members` RENAME TO `organization_members`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `organizations` ADD `slug` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `logo` text;--> statement-breakpoint
ALTER TABLE `organizations` ADD `metadata` text;--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `active_organization_id` text REFERENCES organizations(id);--> statement-breakpoint
CREATE INDEX `documents_original_sha256_hash_index` ON `documents` (`original_sha256_hash`);