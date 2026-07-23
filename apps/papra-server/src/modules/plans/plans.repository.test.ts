import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../config/config.test-utils';
import { PLAN_IDS } from './plans.constants';
import { getOrganizationPlansRecords } from './plans.repository';

describe('plans repository', () => {
  describe('getOrganizationPlansRecords', () => {
    describe('generates a map of organization plans, used in the organization plan repository', () => {
      test('the key indexing the plans is the plan id', async () => {
        const config = overrideConfig({});

        const { organizationPlans } = getOrganizationPlansRecords({ config });
        const organizationPlanEntries = Object.entries(organizationPlans);

        expect(organizationPlanEntries).to.have.length.greaterThan(0);

        for (const [planId, plan] of organizationPlanEntries) {
          expect(planId).to.equal(plan.id);
        }
      });
    });

    test('for self-hosted instances, it make no sense to have a limited free plan, so admin can set the free plan to unlimited using the isFreePlanUnlimited config', async () => {
      const config = overrideConfig({
        organizationPlans: {
          isFreePlanUnlimited: true,
        },
        documentsStorage: {
          maxUploadSize: 0,
        },
      });

      const { organizationPlans } = getOrganizationPlansRecords({ config });

      expect(organizationPlans[PLAN_IDS.FREE]!.limits).to.deep.equal({
        maxDocumentStorageBytes: Number.POSITIVE_INFINITY,
        maxIntakeEmailsCount: Number.POSITIVE_INFINITY,
        maxOrganizationsMembersCount: Number.POSITIVE_INFINITY,
        maxFileSize: Number.POSITIVE_INFINITY,
        aiCreditsPerMonth: Number.POSITIVE_INFINITY,
      });
    });
  });
});
