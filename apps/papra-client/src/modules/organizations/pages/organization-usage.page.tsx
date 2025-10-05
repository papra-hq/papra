import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { Show, Suspense } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganizationUsage } from '@/modules/subscriptions/subscriptions.services';
import { Card, CardContent } from '@/modules/ui/components/card';
import { ProgressCircle } from '@/modules/ui/components/progress-circle';
import { Separator } from '@/modules/ui/components/separator';

const UsageCardLine: Component<{
  title: string;
  description: string;
  used: number;
  limit: number | null;
  formatValue?: (value: number) => string;
}> = (props) => {
  const { t } = useI18n();
  const percentage = () => {
    if (props.limit === null) {
      return 0;
    }
    return Math.min((props.used / props.limit) * 100, 100);
  };

  const formatValue = (value: number) => {
    return props.formatValue ? props.formatValue(value) : value.toString();
  };

  return (
    <div class="flex gap-4 items-center ">
      <ProgressCircle value={percentage()} size="xs" class="flex-shrink-0" />
      <div class="flex-1">
        <div class="font-medium leading-none">{props.title}</div>
        <div class="text-sm text-muted-foreground">{props.description}</div>
      </div>
      <div class="text-muted-foreground leading-none">{ `${formatValue(props.used)} / ${props.limit === null ? t('organization.usage.unlimited') : formatValue(props.limit)}${props.limit ? ` - ${percentage().toFixed(2)}%` : ''}`}</div>
    </div>
  );
};

export const OrganizationUsagePage: Component = () => {
  const params = useParams();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'usage'],
    queryFn: () => fetchOrganizationUsage({ organizationId: params.organizationId }),
  }));

  return (
    <div class="p-6 mt-10 pb-32 mx-auto max-w-screen-md w-full">
      <Suspense>
        <Show when={query.data}>
          {getData => (
            <>
              <h1 class="text-xl font-semibold mb-2">
                {t('organization.usage.page.title')}
              </h1>

              <p class="text-muted-foreground mb-6">
                {t('organization.usage.page.description')}
              </p>

              <Card>
                <CardContent class="pt-6 flex flex-col gap-4">
                  <UsageCardLine
                    title={t('organization.usage.storage.title')}
                    description={t('organization.usage.storage.description')}
                    used={getData().usage.documentsStorage.used}
                    limit={getData().usage.documentsStorage.limit}
                    formatValue={bytes => formatBytes({ bytes, base: 1000 })}
                  />

                  <Separator />

                  <UsageCardLine
                    title={t('organization.usage.intake-emails.title')}
                    description={t('organization.usage.intake-emails.description')}
                    used={getData().usage.intakeEmailsCount.used}
                    limit={getData().usage.intakeEmailsCount.limit}
                  />

                  <Separator />

                  <UsageCardLine
                    title={t('organization.usage.members.title')}
                    description={t('organization.usage.members.description')}
                    used={getData().usage.membersCount.used}
                    limit={getData().usage.membersCount.limit}
                  />

                </CardContent>
              </Card>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
