import { queryClient } from '@/modules/shared/query/query-client';
import { createToast } from '@/modules/ui/components/sonner';
import { useNavigate } from '@solidjs/router';
import { createOrganization } from '../organizations.services';

export function useCreateOrganization() {
  const navigate = useNavigate();

  return {
    createOrganization: async ({ organizationName }: { organizationName: string }) => {
      const { organization } = await createOrganization({ name: organizationName });

      createToast({ type: 'success', message: 'Organization created' });

      await queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });

      navigate(`/organizations/${organization.id}`);
    },
  };
}
