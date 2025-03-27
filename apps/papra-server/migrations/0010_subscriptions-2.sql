ALTER TABLE `organization_subscriptions` RENAME COLUMN "stripe_customer_id" TO "customer_id";--> statement-breakpoint
ALTER TABLE `organization_subscriptions` DROP COLUMN `stripe_subscription_id`;--> statement-breakpoint
DROP INDEX `users_customer_id_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `customer_id`;