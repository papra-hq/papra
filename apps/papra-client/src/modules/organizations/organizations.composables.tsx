import { queryClient } from '@/modules/shared/query/query-client';
import { createToast } from '@/modules/ui/components/sonner';
import { useNavigate } from '@solidjs/router';
import { createOrganization, deleteOrganization, updateOrganization } from './organizations.services';

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

export function useUpdateOrganization() {
  return {
    updateOrganization: async ({ organizationId, organizationName }: { organizationId: string; organizationName: string }) => {
      await updateOrganization({ organizationId, name: organizationName });

      await queryClient.invalidateQueries({
        queryKey: ['organizations'],
        refetchType: 'all',
      });
    },
  };
}

export function useDeleteOrganization() {
  const navigate = useNavigate();

  return {
    deleteOrganization: async ({ organizationId }: { organizationId: string }) => {
      await deleteOrganization({ organizationId });

      await queryClient.invalidateQueries({
        queryKey: ['organizations'],
        refetchType: 'all',
      });

      navigate('/organizations');
    },
  };
}
