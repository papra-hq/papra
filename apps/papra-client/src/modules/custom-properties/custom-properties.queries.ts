import { queryOptions } from '@tanstack/solid-query';
import { fetchCustomPropertyDefinitions } from './custom-properties.services';

export const getCustomPropertyDefinitionsQueryOptions = ({
  organizationId,
}: {
  organizationId: string;
}) =>
  queryOptions({
    queryKey: ['organizations', organizationId, 'custom-properties'],
    queryFn: async () => fetchCustomPropertyDefinitions({ organizationId }),
  });
