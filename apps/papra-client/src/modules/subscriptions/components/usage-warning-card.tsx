import type { Component } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';
import { useQuery } from '@tanstack/solid-query';
import { createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { fetchOrganizationUsage } from '../subscriptions.services';
import { UpgradeDialog } from './upgrade-dialog.component';

const ONE_DAY_IN_MS = 24/* hours */ * 60/* minutes */ * 60/* seconds */ * 1000/* milliseconds */;

export const UsageWarningCard: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();
  const getOrganizationId = () => props.organizationId;
  // TODO: mutualize the creation of the storage key
  const [getDismissedDate, setDismissedDate] = makePersisted(createSignal<number | null>(null), { name: `papra:${getOrganizationId()}:usage-warning-dismissed`, storage: localStorage });

  const query = useQuery(() => ({
    queryKey: ['organizations', getOrganizationId(), 'usage'],
    queryFn: () => fetchOrganizationUsage({ organizationId: getOrganizationId() }),
    refetchOnWindowFocus: false,
  }));

  const getStorageSizeUsedPercent = () => {
    const { data: usageData } = query;

    if (!usageData || usageData.usage.documentsStorage.limit === null) {
      return 0;
    }

    return (usageData.usage.documentsStorage.used / usageData.usage.documentsStorage.limit) * 100;
  };

  const shouldShow = () => {
    const { data: usageData } = query;

    if (!usageData) {
      return false;
    }

    const dismissedAt = getDismissedDate();
    const storagePercent = getStorageSizeUsedPercent();
    const isOver80Percent = storagePercent >= 80;

    if (!isOver80Percent) {
      return false;
    }

    if (dismissedAt) {
      const now = Date.now();

      // Show the warning if the banner was dismissed more than 24h ago
      return dismissedAt + ONE_DAY_IN_MS < now;
    }

    return isOver80Percent;
  };

  return (
    <Show when={shouldShow()}>
      <div class="bg-destructive/10 border-b border-b-destructive text-red-500 px-6 py-3 flex items-center gap-4 ">
        <div class="max-w-5xl mx-auto flex sm:items-center gap-2 flex-col sm:flex-row">

          <span class="text-sm">
            <span class="i-tabler-alert-triangle size-5 inline-block mb--1 mr-2" />
            {t('subscriptions.usage-warning.message', { percent: getStorageSizeUsedPercent().toFixed(2) })}
          </span>

          <UpgradeDialog organizationId={getOrganizationId()}>
            {triggerProps => (
              <Button
                variant="outline"
                size="sm"
                class="flex-shrink-0"
                {...triggerProps}
              >
                {t('subscriptions.usage-warning.upgrade-button')}
              </Button>
            )}
          </UpgradeDialog>

        </div>

        <Button
          variant="ghost"
          size="icon"
          class="ml-auto op-50 hover:op-100 transition flex-shrink-0 hidden sm:flex"
          onClick={() => setDismissedDate(Date.now())}
        >
          <span class="i-tabler-x size-5" />
        </Button>
      </div>
    </Show>
  );
};
