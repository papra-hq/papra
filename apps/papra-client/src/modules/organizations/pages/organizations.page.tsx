import type { Component } from 'solid-js';
import { A, useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { createEffect, For, on } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganizations } from '../organizations.services';

export const OrganizationsPage: Component = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const queries = createQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  createEffect(on(
    () => queries.data?.organizations,
    (orgs) => {
      if (orgs && orgs.length === 0) {
        navigate('/organizations/first');
      }
    },
  ));

  return (
    <div class="p-6 mt-4 pb-32 max-w-5xl mx-auto">
      <h2 class="text-xl font-bold mb-2">
        {t('organizations.list.title')}
      </h2>

      <p class="text-muted-foreground mb-6">
        {t('organizations.list.description')}
      </p>

      <div class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <For each={queries.data?.organizations}>
          {organization => (
            <A
              href={`/organizations/${organization.id}`}
              class="border rounded-lg overflow-hidden"
            >
              <div class="bg-card border-b flex items-center justify-center p-6">
                <div class="size-16 text-muted-foreground"></div>
              </div>

              <div class="p-4">
                <div class="w-full text-left font-bold truncate block">
                  {organization.name}
                </div>
              </div>
            </A>
          )}
        </For>

        <A href="/organizations/create" class="border rounded-lg overflow-hidden border-dashed border-2px p-4 flex flex-col items-center justify-center text-center gap-2 group">
          <div class="i-tabler-plus size-16 text-muted-foreground op-50 group-hover:(text-primary op-100) transition" />

          <div class="font-bold block text-muted-foreground">
            {t('organizations.list.create-new')}
          </div>
        </A>
      </div>
    </div>
  );
};
