PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_document_activity_log` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`document_id` text NOT NULL,
	`event` text NOT NULL,
	`event_data` text,
	`user_id` text,
	`tag_id` text,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE cascade ON DELETE set null,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE cascade ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_document_activity_log`("id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id") SELECT "id", "created_at", "document_id", "event", "event_data", "user_id", "tag_id" FROM `document_activity_log`;--> statement-breakpoint
DROP TABLE `document_activity_log`;--> statement-breakpoint
ALTER TABLE `__new_document_activity_log` RENAME TO `document_activity_log`;--> statement-breakpoint
PRAGMA foreign_keys=ON;