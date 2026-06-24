import { queryOptions } from '@tanstack/solid-query';
import { fetchOrganizationSettings } from './organizations.services';

export const getOrganizationSettingsQueryOptions = ({
  organizationId,
}: {
  organizationId: string;
}) =>
  queryOptions({
    queryKey: ['organizations', organizationId, 'settings'],
    queryFn: async () => fetchOrganizationSettings({ organizationId }),
  });
