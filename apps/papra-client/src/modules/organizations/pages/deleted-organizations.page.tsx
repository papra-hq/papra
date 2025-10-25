import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query';
import { For, Show } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useConfirmModal } from '@/modules/shared/confirm';
import { Alert, AlertDescription, AlertTitle } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { fetchDeletedOrganizations, restoreOrganization } from '../organizations.services';

export const DeletedOrganizationsPage: Component = () => {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const { confirm } = useConfirmModal();
  const { config } = useConfig();

  const purgeDaysDelay = config.organizations.deletedOrganizationsPurgeDaysDelay;

  const deletedOrgsQuery = useQuery(() => ({
    queryKey: ['organizations', 'deleted'],
    queryFn: fetchDeletedOrganizations,
  }));

  const restoreMutation = useMutation(() => ({
    mutationFn: restoreOrganization,
    onSuccess: async () => {
      createToast({
        message: t('organizations.list.deleted.restore-success'),
        type: 'success',
      });
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  }));

  const handleRestore = async (organizationId: string) => {
    const confirmed = await confirm({
      title: t('organizations.list.deleted.restore-confirm.title'),
      message: t('organizations.list.deleted.restore-confirm.message'),
      confirmButton: {
        text: t('organizations.list.deleted.restore-confirm.confirm-button'),
      },
    });

    if (!confirmed) {
      return;
    }
    restoreMutation.mutate({ organizationId });
  };

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <Button variant="ghost" as={A} href="/organizations" class="text-muted-foreground gap-2 ml--4">
        <div class="i-tabler-arrow-left size-5" />
        {t('organizations.list.back')}
      </Button>

      <h2 class="text-xl font-bold">
        {t('organizations.list.deleted.title')}
      </h2>
      <p class="text-muted-foreground mb-6">
        {t('organizations.list.deleted.description', { days: purgeDaysDelay })}
      </p>

      <Show
        when={deletedOrgsQuery.data?.organizations && deletedOrgsQuery.data.organizations.length > 0}
        fallback={(
          <Alert variant="muted" class="my-4 flex items-center gap-4">
            <div class="i-tabler-info-circle size-10 text-primary flex-shrink-0 hidden sm:block" />
            <div>
              <AlertTitle>{t('organizations.list.deleted.empty')}</AlertTitle>
              <AlertDescription>
                {t('organizations.list.deleted.empty-description', { days: purgeDaysDelay })}
              </AlertDescription>
              <Button as={A} href="/organizations" variant="outline" class="mt-2 hover:(bg-primary text-primary-foreground) transition-colors" size="sm">
                <div class="i-tabler-arrow-left size-4 mr-2" />
                {t('organizations.list.back')}
              </Button>
            </div>
          </Alert>
        )}
      >
        <div class="space-y-3">
          <For each={deletedOrgsQuery.data?.organizations}>
            {(organization) => {
              const daysUntilPurge = organization.scheduledPurgeAt
                ? Math.ceil((organization.scheduledPurgeAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : purgeDaysDelay;

              return (
                <div class="border rounded-lg p-4 bg-card">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-semibold text-base truncate">
                        {organization.name}
                      </h3>
                      <div class="mt-2 text-sm text-muted-foreground flex flex-col sm:flex-row sm:gap-2 flex-wrap">
                        <Show when={organization.deletedAt}>
                          <div class="flex-shrink-0">
                            {t('organizations.list.deleted.deleted-at', {
                              date: formatDate(organization.deletedAt!),
                            })}
                          </div>
                        </Show>
                        <Show when={organization.scheduledPurgeAt}>
                          <div class="text-red-500 flex-shrink-0">
                            {t('organizations.list.deleted.purge-at', {
                              date: formatDate(organization.scheduledPurgeAt!),
                            })}
                            {' '}
                            {t('organizations.list.deleted.days-remaining', { daysUntilPurge })}
                          </div>
                        </Show>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleRestore(organization.id)}
                      disabled={restoreMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <div class="i-tabler-restore size-4 mr-2" />
                      {t('organizations.list.deleted.restore')}
                    </Button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>
    </div>
  );
};
