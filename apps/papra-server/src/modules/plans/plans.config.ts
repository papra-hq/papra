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
  plusPlanPriceId: {
    doc: 'The price id of the plus plan',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_PLUS_PLAN_PRICE_ID',
  },
  familyPlanPriceId: {
    doc: 'The price id of the family plan',
    schema: z.string(),
    default: 'change-me',
    env: 'PLANS_FAMILY_PLAN_PRICE_ID',
  },
} as const satisfies ConfigDefinition;
