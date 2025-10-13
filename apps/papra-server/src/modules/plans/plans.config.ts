import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { booleanishSchema } from '../config/config.schemas';

export const organizationPlansConfig = {
  isFreePlanUnlimited: {
    doc: 'Whether the free plan is unlimited, meaning it has no limits on the number of documents, tags, and organizations, basically always true for self-hosted instances',
    schema: booleanishSchema,
    default: true,
    env: 'IS_FREE_PLAN_UNLIMITED',
  },
  plusPlanMonthlyPriceId: {
    doc: 'The monthly price id of the plus plan (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_PLUS_PLAN_MONTHLY_PRICE_ID',
  },
  plusPlanAnnualPriceId: {
    doc: 'The annual price id of the plus plan (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_PLUS_PLAN_ANNUAL_PRICE_ID',
  },
  proPlanMonthlyPriceId: {
    doc: 'The monthly price id of the pro plan (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_PRO_PLAN_MONTHLY_PRICE_ID',
  },
  proPlanAnnualPriceId: {
    doc: 'The annual price id of the pro plan (useless for self-hosting)',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_PRO_PLAN_ANNUAL_PRICE_ID',
  },
} as const satisfies ConfigDefinition;
