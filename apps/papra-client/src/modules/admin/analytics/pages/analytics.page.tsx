import type { Component } from 'solid-js';
import { formatBytes } from '@corentinth/chisels';
import { useQuery } from '@tanstack/solid-query';
import { Suspense } from 'solid-js';
import { getDocumentStats, getOrganizationCount, getUserCount } from '../analytics.services';

const AnalyticsCard: Component<{
  icon: string;
  title: string;
  value: () => number | undefined;
  formatValue?: (value: number) => string;
}> = (props) => {
  const formattedValue = () => {
    const value = props.value();
    if (value === undefined) {
      return '';
    }
    return props.formatValue ? props.formatValue(value) : value.toLocaleString();
  };

  return (
    <div class="bg-card rounded-lg px-6 py-4 border">
      <div class="flex flex-row items-center mb-4 gap-2">
        <div class="flex items-center justify-center size-6 bg-muted rounded">
          <div class={`${props.icon} text-muted-foreground size-4`} />
        </div>
        <h2 class="text-sm font-light">{props.title}</h2>
      </div>

      <Suspense fallback={<div class="h-8 w-16 animate-pulse bg-muted rounded" />}>
        <div class="text-3xl font-light">
          {formattedValue()}
        </div>
      </Suspense>
    </div>
  );
};

export const AdminAnalyticsPage: Component = () => {
  const userCountQuery = useQuery(() => ({
    queryKey: ['admin', 'users', 'count'],
    queryFn: getUserCount,
  }));

  const documentStatsQuery = useQuery(() => ({
    queryKey: ['admin', 'documents', 'stats'],
    queryFn: getDocumentStats,
  }));

  const organizationCountQuery = useQuery(() => ({
    queryKey: ['admin', 'organizations', 'count'],
    queryFn: getOrganizationCount,
  }));

  return (
    <div class="px-6 pt-4">
      <h1 class="text-2xl font-medium mb-1">Dashboard</h1>
      <p class="text-muted-foreground">Insights and analytics about Papra usage.</p>

      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnalyticsCard
          icon="i-tabler-users"
          title="User count"
          value={() => userCountQuery.data?.userCount}
        />

        <AnalyticsCard
          icon="i-tabler-building"
          title="Organization count"
          value={() => organizationCountQuery.data?.organizationCount}
        />

        <AnalyticsCard
          icon="i-tabler-file"
          title="Document count"
          value={() => documentStatsQuery.data?.documentsCount}
        />

        <AnalyticsCard
          icon="i-tabler-database"
          title="Documents storage"
          value={() => documentStatsQuery.data?.documentsSize}
          formatValue={bytes => formatBytes({ bytes, base: 1000 })}
        />

        <AnalyticsCard
          icon="i-tabler-file-x"
          title="Deleted documents"
          value={() => documentStatsQuery.data?.deletedDocumentsCount}
        />

        <AnalyticsCard
          icon="i-tabler-database-x"
          title="Deleted storage"
          value={() => documentStatsQuery.data?.deletedDocumentsSize}
          formatValue={bytes => formatBytes({ bytes, base: 1000 })}
        />
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
