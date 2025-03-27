import type { Expand } from '@corentinth/chisels';
import type { organizationSubscriptionsTable } from './subscriptions.tables';

export type Subscription = Expand<typeof organizationSubscriptionsTable.$inferSelect>;

export type DbInsertableSubscription = Expand<typeof organizationSubscriptionsTable.$inferInsert>;
