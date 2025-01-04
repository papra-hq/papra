import type { Invoice } from '@/modules/payments/payments.types';
import type { Component } from 'solid-js';
import { cancelSubscription, fetchInvoices, fetchSubscriptionQuota, fetchUserSubscription, getCustomerPortalUrl } from '@/modules/payments/payments.services';
import { useConfirmModal } from '@/modules/shared/confirm';
import { formatAmountInCents } from '@/modules/shared/currency';
import { clearQueryCache } from '@/modules/shared/query/query-client';
import { Badge } from '@/modules/ui/components/badge';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardFooter } from '@/modules/ui/components/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/modules/ui/components/dropdown-menu';
import { Progress } from '@/modules/ui/components/progress';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/modules/ui/components/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/modules/ui/components/tooltip';
import { safely } from '@corentinth/chisels';
import { A } from '@solidjs/router';
import { createQueries } from '@tanstack/solid-query';
import { capitalize } from 'lodash-es';
import { For, Show, Suspense } from 'solid-js';
import { toast } from 'solid-sonner';
import { useCurrentUser } from '../composables/useCurrentUser';

const InvoiceList: Component<{ invoices?: Invoice[] }> = (props) => {
  return (

    <div class="mt-8 border rounded-lg">
      <Table>
        <TableCaption class="sr-only">
          Invoices
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>
              Invoice Date
            </TableHead>
            <TableHead>
              Amount Due
            </TableHead>
            <TableHead>
              Status
            </TableHead>
            <TableHead class="text-right">
              Actions
            </TableHead>

          </TableRow>

        </TableHeader>

        <TableBody>
          <For each={props.invoices ?? []}>
            {invoice => (
              <TableRow>
                <TableCell>
                  <span title={invoice.createdAt.toLocaleString()}>
                    {invoice.createdAt.toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  {formatAmountInCents({ amountInCents: invoice.amountDue })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">

                    {capitalize(invoice.status)}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button href={invoice.pdfUrl} as="a" target="_blank" rel="noopener noreferrer" download size="icon" variant="ghost">
                        <div class="i-tabler-download size-4"></div>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Download invoice PDF
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
              </TableRow>
            )}

          </For>

        </TableBody>
      </Table>
    </div>

  );
};

export function SettingsBillingPage() {
  const { confirm } = useConfirmModal();
  const { refreshCurrentUser } = useCurrentUser();

  const query = createQueries(() => ({
    queries: [
      {
        queryKey: ['subscription'],
        queryFn: fetchUserSubscription,
      },
      {
        queryKey: ['invoices'],
        queryFn: fetchInvoices,
      },
      {
        queryKey: ['subscriptionQuota'],
        queryFn: () => fetchSubscriptionQuota(),
      },
    ],
  }));

  const getPlanId = () => query[0].data?.planId;
  const getSubscription = () => query[0].data?.subscription;
  const getInvoices = () => query[1].data?.invoices ?? [];
  const getSubscriptionQuota = () => query[2].data;

  async function downgradeToFreePlan() {
    const isConfirmed = await confirm({
      title: 'Downgrade to free plan',
      message: 'Are you sure you want to downgrade to the free plan? You will lose access to some features.',
      confirmButton: {
        text: 'Yes, downgrade to free plan',
        variant: 'destructive',
      },
      cancelButton: {
        text: 'Cancel',
      },
    });

    if (!isConfirmed) {
      return;
    }

    const [, cancelationError] = await safely(cancelSubscription());

    clearQueryCache();
    await refreshCurrentUser();

    if (cancelationError) {
      console.error(cancelationError);
      toast.error('An error occurred while canceling your subscription');
      return;
    }

    toast.success('Your subscription has been canceled');

    await query[0].refetch();
  }

  const getUsagePercentage = () => {
    const { maxRenderingsPerMonth = 1, renderingsCount = 0 } = getSubscriptionQuota() ?? {};
    return 100 * renderingsCount / maxRenderingsPerMonth;
  };

  async function openCustomerPortal() {
    try {
      const { portalUrl } = await getCustomerPortalUrl();
      window.open(portalUrl, '_blank');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while opening the customer portal');
    }
  }

  return (
    <div class="mt-8">
      <Suspense
        fallback={
          <div class="i-tabler-loader-2 animate-spin text-4xl mx-auto" />
        }
      >

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-muted-foreground">
                  Current Plan
                </div>
                <div class="text-xl font-bold">
                  { getPlanId()?.toUpperCase()}
                </div>
              </div>

              { getPlanId() === 'free'
                ? (
                    <Button href="/upgrade-plan" as={A}>
                      Upgrade Plan
                      <div class="i-tabler-arrow-right size-4 ml-2" />
                    </Button>
                  )
                : (
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <Button variant="outline">
                          Manage Plan
                          <div class="i-tabler-chevron-down size-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem class="cursor-pointer" onClick={openCustomerPortal}>
                          <div class="i-tabler-credit-card size-4 mr-2"></div>
                          Manage payment method
                        </DropdownMenuItem>

                        <DropdownMenuItem class="cursor-pointer" onClick={downgradeToFreePlan}>
                          <div class="i-tabler-trash size-4 mr-2"></div>
                          Downgrade to Free Plan
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
            </div>
          </CardContent>

          { getSubscription() && (
            <CardFooter class="border-t p-6">
              <span class="text-muted-foreground mr-2">
                Next billing date:
              </span>
              <span title={getSubscription()?.nextBillingDate.toLocaleString()}>
                { getSubscription()?.nextBillingDate.toLocaleDateString()}
              </span>
            </CardFooter>
          )}

        </Card>

        <div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">

          <Card>
            <CardContent class="p-6">
              <div class="text-muted-foreground mb-1">
                Renderings this month
              </div>
              <div class="flex items-baseline gap-2 mb-3">
                <div class="text-xl font-bold">
                  { getSubscriptionQuota()?.renderingsCount}
                  {' '}
                  /
                  {' '}
                  { getSubscriptionQuota()?.maxRenderingsPerMonth}
                  {' '}
                  <span class="text-muted-foreground text-sm font-normal">
                    renderings
                  </span>
                </div>
              </div>
              <Progress value={getUsagePercentage()} />
            </CardContent>
          </Card>

        </div>

        <Show when={getInvoices().length > 0}>
          <InvoiceList invoices={getInvoices()} />
        </Show>
      </Suspense>
    </div>
  );
}
