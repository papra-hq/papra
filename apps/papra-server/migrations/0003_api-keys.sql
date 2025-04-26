CREATE TABLE `api_key_organizations` (
	`api_key_id` text NOT NULL,
	`organization_member_id` text NOT NULL,
	FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`organization_member_id`) REFERENCES `organization_members`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`key_hash` text NOT NULL,
	`prefix` text NOT NULL,
	`user_id` text NOT NULL,
	`last_used_at` integer,
	`expires_at` integer,
	`permissions` text DEFAULT '[]' NOT NULL,
	`all_organizations` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_keys_key_hash_unique` ON `api_keys` (`key_hash`);--> statement-breakpoint
CREATE INDEX `key_hash_index` ON `api_keys` (`key_hash`);