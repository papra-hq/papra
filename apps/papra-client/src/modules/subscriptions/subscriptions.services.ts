import type { OrganizationSubscription } from './subscriptions.types';
import { apiClient } from '../shared/http/api-client';

export async function getCheckoutUrl({ organizationId, planId }: { organizationId: string; planId: string }) {
  const { checkoutUrl } = await apiClient<{ checkoutUrl: string }>({
    method: 'POST',
    path: `/api/organizations/${organizationId}/checkout-session`,
    body: {
      planId,
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

export async function getOrganizationSubscription({ organizationId }: { organizationId: string }) {
  const { subscription } = await apiClient<{ subscription: OrganizationSubscription }>({
    method: 'GET',
    path: `/api/organizations/${organizationId}/subscription`,
  });

  return { subscription };
}
