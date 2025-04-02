import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { FREE_PLAN_ID, PLUS_PLAN_ID } from './plans.constants';
import { createPlansRepository } from './plans.repository';
import { getOrganizationPlan } from './plans.usecases';

describe('plans usecases', () => {
  describe('getOrganizationPlan', () => {
    test('an organization may be subscribed to a plan', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        organizationSubscriptions: [{
          id: 'org_sub_1',
          organizationId: 'organization-1',
          planId: PLUS_PLAN_ID,
          customerId: 'cus_123',
          seatsCount: 1,
          status: 'active',
          currentPeriodStart: new Date('2025-03-18T00:00:00.000Z'),
          currentPeriodEnd: new Date('2025-04-18T00:00:00.000Z'),
          cancelAtPeriodEnd: false,
        }],
      });

      const config = await overrideConfig({
        organizationPlans: {
          plusPlanPriceId: 'price_123',
        },
      });

      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      const { organizationPlan } = await getOrganizationPlan({ organizationId: 'organization-1', subscriptionsRepository, plansRepository });

      expect(organizationPlan.id).to.equal(PLUS_PLAN_ID);
    });

    test('an organization may not have any subscription, in this case the organization is considered to be on the free plan', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
      });

      const config = await overrideConfig({
        organizationPlans: {
          plusPlanPriceId: 'price_123',
        },
      });

      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });

      const { organizationPlan } = await getOrganizationPlan({ organizationId: 'organization-1', subscriptionsRepository, plansRepository });

      expect(organizationPlan.id).to.equal(FREE_PLAN_ID);
    });
  });
});
