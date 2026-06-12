import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { PLAN_IDS } from './plans.constants';
import { createPlansRepository } from './plans.repository';
import { getOrganizationPlan } from './plans.usecases';
import { createPlanEntitlementDefinitionRegistry } from '../plan-entitlements/plan-entitlements.registry';
import { createPlanEntitlementsRepository } from '../plan-entitlements/plan-entitlements.repository';

describe('plans usecases', () => {
  describe('getOrganizationPlan', () => {
    test('an organization may be subscribed to a plan', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        organizationSubscriptions: [
          {
            id: 'org_sub_1',
            organizationId: 'organization-1',
            planId: PLAN_IDS.PLUS,
            customerId: 'cus_123',
            seatsCount: 10,
            status: 'active',
            currentPeriodStart: new Date('2025-03-18T00:00:00.000Z'),
            currentPeriodEnd: new Date('2025-04-18T00:00:00.000Z'),
            cancelAtPeriodEnd: false,
          },
        ],
      });

      const config = overrideConfig({
        organizationPlans: {
          plusPlanAnnualPriceId: 'price_123',
          plusPlanMonthlyPriceId: 'price_456',
        },
      });

      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createPlanEntitlementDefinitionRegistry({ config });

      const { organizationPlan } = await getOrganizationPlan({
        organizationId: 'organization-1',
        subscriptionsRepository,
        plansRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(organizationPlan.id).to.equal(PLAN_IDS.PLUS);
    });

    test('an organization may not have any subscription, in this case the organization is considered to be on the free plan', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const config = overrideConfig({
        organizationPlans: {
          plusPlanAnnualPriceId: 'price_123',
          plusPlanMonthlyPriceId: 'price_456',
        },
      });

      const plansRepository = createPlansRepository({ config });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createPlanEntitlementDefinitionRegistry({ config });

      const { organizationPlan } = await getOrganizationPlan({
        organizationId: 'organization-1',
        subscriptionsRepository,
        plansRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(organizationPlan.id).to.equal(PLAN_IDS.FREE);
    });

    describe('plan entitlements', () => {
      test('an organization owner may have a plan entitlement that overrides the organization subscription plan', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          ],
          planEntitlements: [
            {
              id: 'entitlement-1',
              userId: 'user-1',
              type: 'selfhst-premium',
              grantedAt: new Date('2026-01-01'),
              source: 'user-claim',
            },
          ],
        });

        const config = overrideConfig();

        const plansRepository = createPlansRepository({ config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
        const planEntitlementDefinitionRegistry = createPlanEntitlementDefinitionRegistry({
          config,
        });

        const { organizationPlan } = await getOrganizationPlan({
          organizationId: 'organization-1',
          subscriptionsRepository,
          plansRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        });

        expect(organizationPlan.id).to.equal(PLAN_IDS.FREE_EXTENDED);
      });

      test('if an organization have a better subscription plan than the plan entitlement, the subscription plan should be applied', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          ],
          organizationSubscriptions: [
            {
              id: 'subscription-1',
              organizationId: 'organization-1',
              planId: PLAN_IDS.PLUS,
              status: 'active',
              currentPeriodEnd: new Date('2026-12-31'),
              currentPeriodStart: new Date('2026-01-01'),
              customerId: 'cus_123',
              seatsCount: 10,
            },
          ],
          planEntitlements: [
            {
              id: 'entitlement-1',
              userId: 'user-1',
              type: 'selfhst-premium',
              grantedAt: new Date('2026-01-01'),
              source: 'user-claim',
            },
          ],
        });

        const config = overrideConfig();

        const plansRepository = createPlansRepository({ config });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
        const planEntitlementDefinitionRegistry = createPlanEntitlementDefinitionRegistry({
          config,
        });

        const { organizationPlan } = await getOrganizationPlan({
          organizationId: 'organization-1',
          subscriptionsRepository,
          plansRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        });

        expect(organizationPlan.id).to.equal(PLAN_IDS.PLUS);
      });
    });
  });
});
