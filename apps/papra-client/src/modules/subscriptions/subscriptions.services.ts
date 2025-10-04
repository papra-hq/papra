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
  const { subscription, plan } = await apiClient<{ subscription: OrganizationSubscription; plan: { id: string; name: string } }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/subscription`,
  });

  return { subscription, plan };
}
