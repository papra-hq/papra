import type { Component } from 'solid-js';
import type { ApiKey } from '../api-keys.types';
import { A } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { format } from 'date-fns';
import { For, Match, Show, Suspense, Switch } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { createToast } from '@/modules/ui/components/sonner';
import { deleteApiKey, fetchApiKeys } from '../api-keys.services';

export const ApiKeyCard: Component<{ apiKey: ApiKey }> = ({ apiKey }) => {
  const { t } = useI18n();
  const { confirm } = useConfirmModal();

  const deleteApiKeyMutation = createMutation(() => ({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      createToast({
        message: t('api-keys.delete.success'),
      });
    },
  }));

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t('api-keys.delete.confirm.title'),
      message: t('api-keys.delete.confirm.message'),
      confirmButton: {
        text: t('api-keys.delete.confirm.confirm-button'),
        variant: 'destructive',
      },
      cancelButton: {
        text: t('api-keys.delete.confirm.cancel-button'),
      },
    });

    if (!confirmed) {
      return;
    }

    deleteApiKeyMutation.mutate({ apiKeyId: apiKey.id });
  };

  return (
    <div class="bg-card rounded-lg border p-4 flex items-center gap-4">
      <div class="rounded-lg bg-muted p-2">
        <div class="i-tabler-key text-muted-foreground size-5 text-primary" />
      </div>
      <div class="flex-1">
        <h2 class="text-sm font-medium leading-tight">{apiKey.name}</h2>
        <p class="text-muted-foreground text-xs font-mono">{`${apiKey.prefix}...`}</p>
      </div>

      <div>
        <p class="text-muted-foreground text-xs">
          {t('api-keys.list.card.last-used')}
          {' '}
          {apiKey.lastUsedAt ? format(apiKey.lastUsedAt, 'MMM d, yyyy') : t('api-keys.list.card.never')}
        </p>
        <p class="text-muted-foreground text-xs">
          {t('api-keys.list.card.created')}
          {' '}
          {format(apiKey.createdAt, 'MMM d, yyyy')}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          isLoading={deleteApiKeyMutation.isPending}
          onClick={handleDelete}
        >
          <div class="i-tabler-trash text-muted-foreground size-4" />
        </Button>
      </div>
    </div>
  );
};

export const ApiKeysPage: Component = () => {
  const { t } = useI18n();
  const query = createQuery(() => ({
    queryKey: ['api-keys'],
    queryFn: () => fetchApiKeys(),
  }));

  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl w-full">
      <div class="border-b pb-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold mb-1">{t('api-keys.list.title')}</h1>
          <p class="text-muted-foreground">{t('api-keys.list.description')}</p>
        </div>
        <div>
          <Show when={query.data?.apiKeys?.length}>
            <Button as={A} href="/api-keys/create" class="gap-2">
              <div class="i-tabler-plus size-4" />
              {t('api-keys.list.create')}
            </Button>
          </Show>
        </div>
      </div>

      <Suspense>
        <Switch>
          <Match when={query.data?.apiKeys?.length === 0}>
            <EmptyState
              title={t('api-keys.list.empty.title')}
              description={t('api-keys.list.empty.description')}
              icon="i-tabler-key"
              cta={(
                <Button as={A} href="/api-keys/create" class="gap-2">
                  <div class="i-tabler-plus size-4" />
                  {t('api-keys.list.create')}
                </Button>
              )}
            />
          </Match>

          <Match when={query.data?.apiKeys?.length}>

            <div class="mt-6 flex flex-col gap-2">
              <For each={query.data?.apiKeys}>
                {apiKey => (
                  <ApiKeyCard apiKey={apiKey} />
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </Suspense>
    </div>
  );
};
