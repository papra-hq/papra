import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { A, useNavigate } from '@solidjs/router';
import { createQueries, useQuery } from '@tanstack/solid-query';
import { createEffect, For, on, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { getOrganizationDocumentsStats } from '@/modules/documents/documents.services';
import { timeAgo } from '@/modules/shared/date/time-ago';
import { fetchOrganizations, fetchOrganizationMembers } from '../organizations.services';

export const OrganizationsPage: Component = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  // Create queries for stats of each organization
  const statsQueries = createQueries(() => ({
    queries: query.data?.organizations.flatMap(org => [
      {
        queryKey: ['organizations', org.id, 'members'],
        queryFn: () => fetchOrganizationMembers({ organizationId: org.id }),
        enabled: !!query.data?.organizations.length,
      },
      {
        queryKey: ['organizations', org.id, 'documents', 'stats'],
        queryFn: () => getOrganizationDocumentsStats({ organizationId: org.id }),
        enabled: !!query.data?.organizations.length,
      },
    ]) ?? [],
  }));

  const getOrganizationStats = (organizationId: string) => {
    if (!query.data?.organizations.length) return null;
    
    const orgIndex = query.data.organizations.findIndex(org => org.id === organizationId);
    if (orgIndex === -1) return null;
    
    const membersQueryIndex = orgIndex * 2;
    const documentsQueryIndex = orgIndex * 2 + 1;
    
    const membersQuery = statsQueries[membersQueryIndex];
    const documentsQuery = statsQueries[documentsQueryIndex];
    
    return {
      membersCount: (membersQuery?.data as any)?.members?.length ?? 0,
      documentsCount: (documentsQuery?.data as any)?.organizationStats?.documentsCount ?? 0,
      documentsSize: (documentsQuery?.data as any)?.organizationStats?.documentsSize ?? 0,
      isLoading: membersQuery?.isLoading || documentsQuery?.isLoading,
    };
  };

  createEffect(on(
    () => query.data?.organizations,
    (orgs) => {
      if (orgs && orgs.length === 0) {
        navigate('/organizations/first');
      }
    },
  ));

  return (
    <div class="p-6 mt-4 pb-32 max-w-6xl mx-auto">
      <div class="mb-8">
        <h2 class="text-2xl font-bold mb-2">
          {t('organizations.list.title')}
        </h2>

        <p class="text-muted-foreground">
          {t('organizations.list.description')}
        </p>
      </div>

      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
        <For each={query.data?.organizations}>
          {organization => {
            const stats = getOrganizationStats(organization.id);
            return (
              <A
                href={`/organizations/${organization.id}`}
                class="group border rounded-xl overflow-hidden bg-card hover:shadow-lg transition-all duration-200 hover:border-primary/20 hover:-translate-y-1"
              >
                <div class="p-6 h-full flex flex-col">
                  {/* Organization Icon and Header */}
                  <div class="mb-4">
                    <div class="flex items-start gap-4 mb-2">
                      <div class="bg-primary/10 flex items-center justify-center p-3 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <div class="i-tabler-building size-6 text-primary"></div>
                      </div>
                      <div class="flex-1 min-w-0">
                        <h3 class="font-bold text-lg group-hover:text-primary transition-colors leading-tight line-clamp-2 h-14">
                          {organization.name}
                        </h3>
                      </div>
                    </div>
                    <p class="text-sm text-muted-foreground">
                      Created {timeAgo({ date: organization.createdAt })}
                    </p>
                  </div>

                  {/* Statistics */}
                  <div class="space-y-3 mb-6 flex-grow">
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <div class="i-tabler-users size-4"></div>
                        <span>Members</span>
                      </div>
                      <Show when={!stats?.isLoading} fallback={<div class="h-4 w-8 bg-muted animate-pulse rounded"></div>}>
                        <span class="font-medium">{stats?.membersCount ?? 0}</span>
                      </Show>
                    </div>

                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <div class="i-tabler-file-text size-4"></div>
                        <span>Documents</span>
                      </div>
                      <Show when={!stats?.isLoading} fallback={<div class="h-4 w-8 bg-muted animate-pulse rounded"></div>}>
                        <span class="font-medium">{stats?.documentsCount ?? 0}</span>
                      </Show>
                    </div>

                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <div class="i-tabler-database size-4"></div>
                        <span>Storage</span>
                      </div>
                      <Show when={!stats?.isLoading} fallback={<div class="h-4 w-12 bg-muted animate-pulse rounded"></div>}>
                        <span class="font-medium">
                          {formatBytes({ bytes: stats?.documentsSize ?? 0, base: 1000 })}
                        </span>
                      </Show>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div class="pt-4 border-t border-muted">
                    <div class="flex items-center justify-between">
                      <div class="text-sm text-muted-foreground">
                        View organization
                      </div>
                      <div class="i-tabler-arrow-right size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all"></div>
                    </div>
                  </div>
                </div>
              </A>
            );
          }}
        </For>

        {/* Create New Organization Card */}
        <A 
          href="/organizations/create" 
          class="group border-2 border-dashed rounded-xl overflow-hidden border-muted hover:border-primary/50 bg-muted/20 hover:bg-muted/30 transition-all duration-200 hover:-translate-y-1"
        >
          <div class="p-6 h-full flex flex-col items-center justify-center text-center gap-6">
            <div class="bg-primary/10 flex items-center justify-center p-4 rounded-lg group-hover:bg-primary/20 transition-colors">
              <div class="i-tabler-plus size-8 text-primary group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <div class="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                {t('organizations.list.create-new')}
              </div>
              <div class="text-sm text-muted-foreground">
                Start organizing your documents
              </div>
            </div>

            <div class="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <span>Get started</span>
              <div class="i-tabler-arrow-right size-4 group-hover:translate-x-1 transition-transform"></div>
            </div>
          </div>
        </A>
      </div>
    </div>
  );
};
