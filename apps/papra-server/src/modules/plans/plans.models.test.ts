import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../config/config.test-utils';
import { PLAN_IDS } from './plans.constants';
import { resolveOrganizationPlanFromPriceIds } from './plans.models';
import { getOrganizationPlansRecords } from './plans.repository';

function createOrganizationPlans() {
  const config = overrideConfig({
    organizationPlans: {
      plusPlanMonthlyPriceId: 'price_plus_monthly',
      plusPlanAnnualPriceId: 'price_plus_annual',
      proPlanMonthlyPriceId: 'price_pro_monthly',
      proPlanAnnualPriceId: 'price_pro_annual',
    },
  });

  const { organizationPlans } = getOrganizationPlansRecords({ config });

  return organizationPlans;
}

describe('plans models', () => {
  describe('resolveOrganizationPlanFromPriceIds', () => {
    const organizationPlans = createOrganizationPlans();

    test('the plan is resolved regardless of the position of its price id among the subscription items', () => {
      const { organizationPlan } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_some_addon', 'price_pro_monthly'],
        organizationPlans,
      });

      expect(organizationPlan?.id).to.equal(PLAN_IDS.PRO);
    });

    test('a plan is matched by its annual price id as well as its monthly one', () => {
      expect(
        resolveOrganizationPlanFromPriceIds({
          priceIds: ['price_plus_annual'],
          organizationPlans,
        }).organizationPlan?.id,
      ).to.equal(PLAN_IDS.PLUS);

      expect(
        resolveOrganizationPlanFromPriceIds({
          priceIds: ['price_plus_monthly'],
          organizationPlans,
        }).organizationPlan?.id,
      ).to.equal(PLAN_IDS.PLUS);
    });

    test('price ids matching no plan are reported to the caller instead of being an error, as an unknown price should not prevent the subscription from being synced', () => {
      const { organizationPlan, unknownPriceIds } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_storage_pack', 'price_pro_monthly', 'price_whatever'],
        organizationPlans,
      });

      expect(organizationPlan?.id).to.equal(PLAN_IDS.PRO);
      expect(unknownPriceIds).to.eql(['price_storage_pack', 'price_whatever']);
    });

    test('the monthly and annual prices of a same plan are not considered ambiguous', () => {
      const { organizationPlan } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_pro_monthly', 'price_pro_annual'],
        organizationPlans,
      });

      expect(organizationPlan?.id).to.equal(PLAN_IDS.PRO);
    });

    test('when no price id matches a plan, or when there is no item at all, the plan is undefined', () => {
      expect(
        resolveOrganizationPlanFromPriceIds({ priceIds: ['price_unknown'], organizationPlans })
          .organizationPlan,
      ).to.eql(undefined);

      expect(
        resolveOrganizationPlanFromPriceIds({ priceIds: [], organizationPlans }).organizationPlan,
      ).to.eql(undefined);
    });

    test('a subscription holding the prices of two different plans keeps the most generous one and reports the others, as blocking the sync would leave the subscription stale', () => {
      const { organizationPlan, discardedPlanIds } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_plus_monthly', 'price_pro_monthly'],
        organizationPlans,
      });

      expect(organizationPlan?.id).to.equal(PLAN_IDS.PRO);
      expect(discardedPlanIds).to.eql([PLAN_IDS.PLUS]);
    });

    test('the most generous plan is kept regardless of the order of the subscription items', () => {
      const { organizationPlan, discardedPlanIds } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_pro_annual', 'price_plus_annual'],
        organizationPlans,
      });

      expect(organizationPlan?.id).to.equal(PLAN_IDS.PRO);
      expect(discardedPlanIds).to.eql([PLAN_IDS.PLUS]);
    });

    test('a subscription matching a single plan reports no discarded plan', () => {
      const { discardedPlanIds } = resolveOrganizationPlanFromPriceIds({
        priceIds: ['price_pro_monthly', 'price_pro_annual'],
        organizationPlans,
      });

      expect(discardedPlanIds).to.eql([]);
    });
  });
});
