import { apiClient } from '../shared/http/api-client';

export type PlanEntitlement = {
  id: string;
  userId: string;
  type: string;
  source: string;
  grantedAt: string;
  expiresAt: string | null;
  lastVerifiedAt: string | null;
};

export async function fetchUserPlanEntitlements() {
  const { planEntitlements } = await apiClient<{ planEntitlements: PlanEntitlement[] }>({
    method: 'GET',
    path: '/api/plan-entitlements',
  });

  return { planEntitlements };
}

export async function claimPlanEntitlement({ type }: { type: string }) {
  const { planEntitlement } = await apiClient<{ planEntitlement: PlanEntitlement }>({
    method: 'POST',
    path: `/api/plan-entitlements/${type}/claim`,
  });

  return { planEntitlement };
}
