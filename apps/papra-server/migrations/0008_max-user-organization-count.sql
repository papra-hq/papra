CREATE TABLE `organization_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`organization_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`status` text NOT NULL,
	`current_period_end` integer NOT NULL,
	`current_period_start` integer NOT NULL,
	`cancel_at_period_end` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
DROP INDEX `organizations_slug_unique`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `logo`;--> statement-breakpoint
ALTER TABLE `organizations` DROP COLUMN `metadata`;--> statement-breakpoint
ALTER TABLE `users` ADD `customer_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `max_organization_count` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `users_customer_id_unique` ON `users` (`customer_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `organization_members_user_organization_unique` ON `organization_members` (`organization_id`,`user_id`);