import type { PlanLimits } from '../plans/plans.types';
import type { OrganizationSubscription } from './subscriptions.types';
import { apiClient } from '../shared/http/api-client';

export async function getCheckoutUrl({ organizationId, planId, billingInterval }: { organizationId: string; planId: string; billingInterval: 'monthly' | 'annual' }) {
  const { checkoutUrl } = await apiClient<{ checkoutUrl: string }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/checkout-session`,
    body: {
      planId,
      billingInterval,
    },
  });

  return { checkoutUrl };
}

export async function getCustomerPortalUrl({ organizationId }: { organizationId: string }) {
  const { customerPortalUrl } = await apiClient<{ customerPortalUrl: string }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/customer-portal`,
  });

  return { customerPortalUrl };
}

export async function fetchOrganizationSubscription({ organizationId }: { organizationId: string }) {
  const { subscription, plan } = await apiClient<{
    subscription: OrganizationSubscription;
    plan: {
      id: string;
      name: string;
      limits: PlanLimits;
    };
  }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/subscription`,
  });

  return { subscription, plan };
}

export async function fetchOrganizationUsage({ organizationId }: { organizationId: string }) {
  const { usage, limits } = await apiClient<{
    usage: {
      documentsStorage: { used: number; deleted: number; limit: number | null };
      intakeEmailsCount: { used: number; limit: number | null };
      membersCount: { used: number; limit: number | null };
    };
    limits: PlanLimits;
  }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/usage`,
  });

  return { usage, limits };
}
