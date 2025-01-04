DROP INDEX "token_index";--> statement-breakpoint
DROP INDEX "expires_at_index";--> statement-breakpoint
DROP INDEX "token_user_id_expires_at_index";--> statement-breakpoint
DROP INDEX "role_index";--> statement-breakpoint
DROP INDEX "user_roles_user_id_role_key";--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
DROP INDEX "email_index";--> statement-breakpoint
ALTER TABLE `documents` ALTER COLUMN "original_size" TO "original_size" integer NOT NULL;--> statement-breakpoint
CREATE INDEX `token_index` ON `auth_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `expires_at_index` ON `auth_tokens` (`expires_at`);--> statement-breakpoint
CREATE INDEX `token_user_id_expires_at_index` ON `auth_tokens` (`token`,`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `role_index` ON `user_roles` (`role`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_user_id_role_key` ON `user_roles` (`user_id`,`role`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `email_index` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `documents` ALTER COLUMN "original_size" TO "original_size" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `documents` ALTER COLUMN "size" TO "size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ALTER COLUMN "size" TO "size" integer NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `documents` ADD `storage_key` text NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` DROP COLUMN `original_checksum`;