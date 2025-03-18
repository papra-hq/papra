import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const organizationPlansConfig = {
  isFreePlanUnlimited: {
    doc: 'Whether the free plan is unlimited, meaning it has no limits on the number of documents, tags, and organizations, basically always true for self-hosted instances',
    schema: z
      .string()
      .trim()
      .toLowerCase()
      .transform(x => x === 'true')
      .pipe(z.boolean()),
    default: 'true',
    env: 'IS_FREE_PLAN_UNLIMITED',
  },
  plusPlanPriceId: {
    doc: 'The price id of the plus plan',
    schema: z.string(),
    default: 'price_123456',
    env: 'PLANS_PLUS_PLAN_PRICE_ID',
  },
} as const satisfies ConfigDefinition;
