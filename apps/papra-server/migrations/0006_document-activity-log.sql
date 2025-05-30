CREATE TABLE `document_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`document_id` text NOT NULL,
	`event` text NOT NULL,
	`event_data` text,
	`user_id` text,
	`tag_id` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE no action,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE cascade ON DELETE no action
);
