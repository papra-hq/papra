
ALTER TABLE `organization_invitations` ALTER COLUMN "role" TO "role" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `organization_invitations_organization_email_unique` ON `organization_invitations` (`organization_id`,`email`);--> statement-breakpoint
ALTER TABLE `organization_invitations` ALTER COLUMN "status" TO "status" text NOT NULL DEFAULT 'pending';