import type { Invoice } from './payments.types';
import { map } from 'lodash-es';
import { apiClient } from '../shared/http/http-client';

export async function getCheckoutUrl({ planId, billingInterval }: { planId: string; billingInterval: string }) {
  const { checkoutUrl } = await apiClient<{ checkoutUrl: string }>({
    method: 'POST',
    path: `/api/payments/checkout-session`,
    body: {
      billingInterval,
      planId,
    },
  });

  return { checkoutUrl };
}

export async function getCheckoutSessionStatus({ sessionId }: { sessionId: string }) {
  const { isPaid, status } = await apiClient<{
    isPaid: boolean;
    status: string;
  }>({
    method: 'GET',
    path: `/api/payments/checkout-session/${sessionId}`,
  });

  return { isPaid, status };
}

export async function fetchUserSubscription() {
  const { subscription, planId } = await apiClient<{
    planId: string;
    subscription?: {
      nextBillingDate: string;
    };
  }>({
    method: 'GET',
    path: '/api/payments/subscription',
  });

  return {
    planId,
    subscription: subscription
      ? {
          nextBillingDate: new Date(subscription.nextBillingDate),
        }
      : undefined,
  };
}

export async function cancelSubscription() {
  await apiClient({
    method: 'DELETE',
    path: '/api/payments/subscription',
  });
}

export async function fetchInvoices() {
  const { invoices } = await apiClient<{ invoices: Invoice[] }>({
    method: 'GET',
    path: '/api/payments/invoices',
  });

  return {
    invoices: map(invoices, invoice => ({
      ...invoice,
      createdAt: new Date(invoice.createdAt),
    })),
  };
}

export async function fetchSubscriptionQuota({ userId }: { userId?: string } = {}) {
  const { maxRenderingsPerMonth, renderingsCount } = await apiClient<{ renderingsCount: number; maxRenderingsPerMonth: number }>({
    method: 'GET',
    path: '/api/subscription/quotas',
    impersonatedUserId: userId,
  });

  return { maxRenderingsPerMonth, renderingsCount };
}

export async function getCustomerPortalUrl() {
  const { portalUrl } = await apiClient<{ portalUrl: string }>({
    method: 'GET',
    path: '/api/payments/customer-portal',
  });

  return { portalUrl };
}
