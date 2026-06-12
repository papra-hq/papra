export const PLAN_IDS = {
  FREE: 'free',
  FREE_EXTENDED: 'free-extended', // For partnerships
  PLUS: 'plus',
  PRO: 'pro',
} as const;

export const FREE_PLANS_IDS = [PLAN_IDS.FREE, PLAN_IDS.FREE_EXTENDED] as const;

export const PLAN_PRIORITY: Record<PlanId, number> = {
  [PLAN_IDS.FREE]: 0,
  [PLAN_IDS.FREE_EXTENDED]: 1,
  [PLAN_IDS.PLUS]: 2,
  [PLAN_IDS.PRO]: 3,
};

export type PlanId = (typeof PLAN_IDS)[keyof typeof PLAN_IDS];
