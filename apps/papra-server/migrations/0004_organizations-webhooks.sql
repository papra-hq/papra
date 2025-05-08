CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`webhook_id` text NOT NULL,
	`event_name` text NOT NULL,
	`request_payload` text NOT NULL,
	`response_payload` text NOT NULL,
	`response_status` integer NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`webhook_id` text NOT NULL,
	`event_name` text NOT NULL,
	FOREIGN KEY (`webhook_id`) REFERENCES `webhooks`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `webhook_events_webhook_id_event_name_unique` ON `webhook_events` (`webhook_id`,`event_name`);--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` text,
	`organization_id` text,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE cascade ON DELETE cascade
);
