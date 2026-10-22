import type { Config } from '../../config/config.types';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { Clock } from '../../shared/clock/clock.types';
import type { SubscriptionsRepository } from '../../subscriptions/subscriptions.repository';
import {
  createOrganizationHasActiveSubscriptionError,
  createOrganizationNotFoundError,
} from '../../organizations/organizations.errors';
import { systemClock } from '../../shared/clock/clock';
import { doesSubscriptionBlockDeletion } from '../../subscriptions/subscriptions.models';
import type { Logger } from '../../shared/logger/logger';
import { createLogger } from '../../shared/logger/logger';

export function buildAdminSoftDeleteOrganization({
  organizationsRepository,
  subscriptionsRepository,
  config,
  clock = systemClock,
  logger = createLogger({ namespace: 'admin:organizations' }),
}: {
  organizationsRepository: OrganizationsRepository;
  subscriptionsRepository: SubscriptionsRepository;
  config: Config;
  clock?: Clock;
  logger?: Logger;
}) {
  return async ({ organizationId, deletedBy }: { organizationId: string; deletedBy: string }) => {
    const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

    if (!organization) {
      throw createOrganizationNotFoundError();
    }

    // Retrying must not reset the purge deadline or change who can restore the organization.
    if (organization.deletedAt) {
      return;
    }

    const { subscription } = await subscriptionsRepository.getActiveOrganizationSubscription({
      organizationId,
    });

    if (doesSubscriptionBlockDeletion(subscription)) {
      throw createOrganizationHasActiveSubscriptionError();
    }

    await organizationsRepository.deleteAllMembersFromOrganization({ organizationId });
    await organizationsRepository.deleteAllOrganizationInvitations({ organizationId });
    await organizationsRepository.softDeleteOrganization({
      organizationId,
      deletedBy,
      now: new Date(clock.now().epochMilliseconds),
      purgeDaysDelay: config.organizations.deletedOrganizationsPurgeDaysDelay,
    });

    logger.info({ organizationId, deletedBy }, 'Organization soft-deleted by admin');
  };
}
