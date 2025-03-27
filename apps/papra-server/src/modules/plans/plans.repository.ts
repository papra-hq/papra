import type { Config } from '../config/config.types';
import type { OrganizationPlanRecord } from './plans.types';
import { injectArguments } from '@corentinth/chisels';
import { FAMILY_PLAN_ID, FREE_PLAN_ID, PLUS_PLAN_ID } from './plans.constants';
import { createPlanNotFoundError } from './plans.errors';

export type PlansRepository = ReturnType<typeof createPlansRepository>;

export function createPlansRepository({ config }: { config: Config }) {
  const { organizationPlans } = getOrganizationPlansRecords({ config });

  return injectArguments(
    {
      getOrganizationPlanById,
      getOrganizationPlanByPriceId,
    },
    {
      organizationPlans,
    },
  );
}

export function getOrganizationPlansRecords({ config }: { config: Config }) {
  const { isFreePlanUnlimited } = config.organizationPlans;

  const organizationPlans: Record<string, OrganizationPlanRecord> = {
    [FREE_PLAN_ID]: {
      id: FREE_PLAN_ID,
      name: 'Free',
      isPerSeat: true,
      limits: {
        maxDocumentStorageBytes: isFreePlanUnlimited ? Number.POSITIVE_INFINITY : 1024 * 1024 * 500, // 500 MB
        maxIntakeEmailsCount: isFreePlanUnlimited ? Number.POSITIVE_INFINITY : 1,
        maxOrganizationsMembersCount: isFreePlanUnlimited ? Number.POSITIVE_INFINITY : 10,
      },

    },
    [PLUS_PLAN_ID]: {
      id: PLUS_PLAN_ID,
      name: 'Plus',
      priceId: config.organizationPlans.plusPlanPriceId,
      isPerSeat: true,
      limits: {
        maxDocumentStorageBytes: 1024 * 1024 * 1024 * 5, // 5 GB
        maxIntakeEmailsCount: 10,
        maxOrganizationsMembersCount: 100,
      },
    },
    [FAMILY_PLAN_ID]: {
      id: FAMILY_PLAN_ID,
      name: 'Family',
      priceId: config.organizationPlans.familyPlanPriceId,
      isPerSeat: false,
      defaultSeatsCount: 6,
      limits: {
        maxDocumentStorageBytes: 1024 * 1024 * 1024 * 5, // 5 GB
        maxIntakeEmailsCount: 10,
        maxOrganizationsMembersCount: 6,
      },
    },
  };

  return { organizationPlans };
}

async function getOrganizationPlanById({ planId, organizationPlans }: { planId: string; organizationPlans: Record<string, OrganizationPlanRecord> }) {
  const organizationPlan = organizationPlans[planId];

  if (!organizationPlan) {
    throw createPlanNotFoundError();
  }

  return { organizationPlan };
}

async function getOrganizationPlanByPriceId({ priceId, organizationPlans }: { priceId: string; organizationPlans: Record<string, OrganizationPlanRecord> }) {
  const organizationPlan = Object.values(organizationPlans).find(plan => plan.priceId === priceId);

  if (!organizationPlan) {
    throw createPlanNotFoundError();
  }

  return { organizationPlan };
}
