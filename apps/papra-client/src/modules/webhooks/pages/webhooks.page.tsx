import type { Component } from 'solid-js';
import type { Webhook } from '../webhooks.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { A, useParams } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { format } from 'date-fns';
import { For, Match, Show, Suspense, Switch } from 'solid-js';
import { deleteWebhook, fetchWebhooks } from '../webhooks.services';

export const WebhookCard: Component<{ webhook: Webhook }> = ({ webhook }) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();
  const params = useParams();

  const deleteWebhookMutation = createMutation(() => ({
    mutationFn: deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', params.organizationId] });
      createToast({
        message: t('webhooks.delete.success'),
      });
    },
  }));

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('webhooks.delete.confirm.title'),
      message: t('webhooks.delete.confirm.message'),
      confirmButton: {
        text: t('webhooks.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('webhooks.delete.confirm.cancel-button'),
      },
    });

    if (!confirmed) {
      return;
    }

    deleteWebhookMutation.mutate({ webhookId: webhook.id, organizationId: params.organizationId });
  };

  return (
    <div class="bg-card rounded-lg border p-4 flex items-center gap-4">
      <div class="rounded-lg bg-muted p-2">
        <div class="i-tabler-webhook text-muted-foreground size-5 text-primary" />
      </div>
      <div class="flex-1 flex flex-col gap-1 overflow-hidden">
        <h2 class="text-sm font-medium leading-tight">{webhook.name}</h2>
        <p class="text-muted-foreground text-xs font-mono truncate">{webhook.url}</p>
      </div>

      <div>
        <p class="text-muted-foreground text-xs">
          {t('webhooks.list.card.last-triggered')}
          {' '}
          {webhook.lastTriggeredAt ? format(webhook.lastTriggeredAt, 'MMM d, yyyy') : t('webhooks.list.card.never')}
        </p>
        <p class="text-muted-foreground text-xs">
          {t('webhooks.list.card.created')}
          {' '}
          {format(webhook.createdAt, 'MMM d, yyyy')}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          as={A}
          href={`/organizations/${params.organizationId}/settings/webhooks/${webhook.id}`}
        >
          <div class="i-tabler-edit text-muted-foreground size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          isLoading={deleteWebhookMutation.isPending}
          onClick={handleDelete}
        >
          <div class="i-tabler-trash text-muted-foreground size-4" />
        </Button>
      </div>
    </div>
  );
};

export const WebhooksPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const query = createQuery(() => ({
    queryKey: ['webhooks', params.organizationId],
    queryFn: () => fetchWebhooks({ organizationId: params.organizationId }),
  }));

  return (
    <div class="p-6 mt-10 pb-32 mx-auto max-w-screen-md w-full">

      <div class="flex gap-4 items-center justify-between">
        <div>
          <h1 class="text-xl font-semibold mb-2">
            {t('webhooks.list.title')}
          </h1>

          <p class="text-muted-foreground">
            {t('webhooks.list.description')}
          </p>
        </div>

        <Show when={query.data?.webhooks?.length}>
          <Button as={A} href={`/organizations/${params.organizationId}/settings/webhooks/create`} class="gap-2">
            <div class="i-tabler-plus size-4" />
            {t('webhooks.list.create')}
          </Button>
        </Show>
      </div>

      <Suspense>
        <Switch>
          <Match when={query.data?.webhooks?.length === 0}>
            <div class="mt-4 py-8 border-2 border-dashed rounded-lg text-center">
              <EmptyState
                title={t('webhooks.list.empty.title')}
                description={t('webhooks.list.empty.description')}
                icon="i-tabler-webhook"
                class="p-0"
                cta={(
                  <Button as={A} href={`/organizations/${params.organizationId}/settings/webhooks/create`} class="gap-2">
                    <div class="i-tabler-plus size-4" />
                    {t('webhooks.list.create')}
                  </Button>
                )}
              />
            </div>
          </Match>

          <Match when={query.data?.webhooks?.length}>
            <div class="mt-6 flex flex-col gap-2">
              <For each={query.data?.webhooks}>
                {webhook => (
                  <WebhookCard webhook={webhook} />
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </Suspense>
    </div>
  );
};
