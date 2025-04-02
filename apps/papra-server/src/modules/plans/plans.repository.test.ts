import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../config/config.test-utils';
import { FREE_PLAN_ID } from './plans.constants';
import { getOrganizationPlansRecords } from './plans.repository';

describe('plans repository', () => {
  describe('getOrganizationPlansRecords', () => {
    describe('generates a map of organization plans, used in the organization plan repository', () => {
      test('the key indexing the plans is the plan id', async () => {
        const config = await overrideConfig({});

        const { organizationPlans } = getOrganizationPlansRecords({ config });
        const organizationPlanEntries = Object.entries(organizationPlans);

        expect(organizationPlanEntries).to.have.length.greaterThan(0);

        for (const [planId, plan] of organizationPlanEntries) {
          expect(planId).to.equal(plan.id);
        }
      });
    });

    test('for self-hosted instances, it make no sense to have a limited free plan, so admin can set the free plan to unlimited using the isFreePlanUnlimited config', async () => {
      const config = await overrideConfig({
        organizationPlans: {
          isFreePlanUnlimited: true,
        },
      });

      const { organizationPlans } = getOrganizationPlansRecords({ config });

      expect(organizationPlans[FREE_PLAN_ID].limits).to.deep.equal({
        maxDocumentStorageBytes: Number.POSITIVE_INFINITY,
        maxIntakeEmailsCount: Number.POSITIVE_INFINITY,
        maxOrganizationsMembersCount: Number.POSITIVE_INFINITY,
      });
    });
  });
});
