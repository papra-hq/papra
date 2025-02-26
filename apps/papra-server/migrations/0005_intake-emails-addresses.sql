ALTER TABLE `intake_emails` ADD `email_address` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `intake_emails_email_address_unique` ON `intake_emails` (`email_address`);--> statement-breakpoint
CREATE INDEX `documents_organization_id_is_deleted_index` ON `documents` (`organization_id`,`is_deleted`);