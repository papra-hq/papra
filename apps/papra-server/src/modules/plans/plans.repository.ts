import type { Config } from '../config/config.types';
import type { OrganizationPlanRecord } from './plans.types';
import { injectArguments } from '@corentinth/chisels';
import { isDocumentSizeLimitEnabled } from '../documents/documents.models';
import { IN_BYTES } from '../shared/units';
import { PLAN_IDS } from './plans.constants';
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
  const { maxUploadSize } = config.documentsStorage;

  const freePlanLimits = {
    maxDocumentStorageBytes: isFreePlanUnlimited
      ? Number.POSITIVE_INFINITY
      : 500 * IN_BYTES.MEGABYTE,
    maxIntakeEmailsCount: isFreePlanUnlimited ? Number.POSITIVE_INFINITY : 1,
    maxOrganizationsMembersCount: isFreePlanUnlimited ? Number.POSITIVE_INFINITY : 3,
    maxFileSize: isDocumentSizeLimitEnabled({ maxUploadSize })
      ? maxUploadSize
      : Number.POSITIVE_INFINITY,
  };

  const organizationPlans: Record<string, OrganizationPlanRecord> = {
    [PLAN_IDS.FREE]: {
      id: PLAN_IDS.FREE,
      name: 'Free',
      limits: freePlanLimits,
    },
    [PLAN_IDS.FREE_EXTENDED]: {
      id: PLAN_IDS.FREE_EXTENDED,
      name: 'Free Extended',
      limits: {
        maxDocumentStorageBytes: freePlanLimits.maxDocumentStorageBytes * 2,
        maxIntakeEmailsCount: freePlanLimits.maxIntakeEmailsCount * 2,
        maxOrganizationsMembersCount: freePlanLimits.maxOrganizationsMembersCount * 2,
        maxFileSize: freePlanLimits.maxFileSize, // Same file size limit as Free plan
      },
    },
    [PLAN_IDS.PLUS]: {
      id: PLAN_IDS.PLUS,
      name: 'Plus',
      monthlyPriceId: config.organizationPlans.plusPlanMonthlyPriceId,
      annualPriceId: config.organizationPlans.plusPlanAnnualPriceId,
      limits: {
        maxDocumentStorageBytes: 5 * IN_BYTES.GIGABYTE, // 5 GiB
        maxIntakeEmailsCount: 10,
        maxOrganizationsMembersCount: 10,
        maxFileSize: 100 * IN_BYTES.MEGABYTE, // 100 MiB
      },
    },
    [PLAN_IDS.PRO]: {
      id: PLAN_IDS.PRO,
      name: 'Pro',
      monthlyPriceId: config.organizationPlans.proPlanMonthlyPriceId,
      annualPriceId: config.organizationPlans.proPlanAnnualPriceId,
      limits: {
        maxDocumentStorageBytes: 50 * IN_BYTES.GIGABYTE, // 50 GiB
        maxIntakeEmailsCount: 100,
        maxOrganizationsMembersCount: 50,
        maxFileSize: 500 * IN_BYTES.MEGABYTE, // 500 MiB
      },
    },
  };

  return { organizationPlans };
}

async function getOrganizationPlanById({
  planId,
  organizationPlans,
}: {
  planId: string;
  organizationPlans: Record<string, OrganizationPlanRecord>;
}) {
  const organizationPlan = organizationPlans[planId];

  if (!organizationPlan) {
    throw createPlanNotFoundError();
  }

  return { organizationPlan };
}

async function getOrganizationPlanByPriceId({
  priceId,
  organizationPlans,
}: {
  priceId: string;
  organizationPlans: Record<string, OrganizationPlanRecord>;
}) {
  const organizationPlan = Object.values(organizationPlans).find(
    (plan) => plan.monthlyPriceId === priceId || plan.annualPriceId === priceId,
  );

  if (!organizationPlan) {
    throw createPlanNotFoundError();
  }

  return { organizationPlan };
}
