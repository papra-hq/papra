import { useNavigate, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { queryClient } from '@/modules/shared/query/query-client';
import { createToast } from '@/modules/ui/components/sonner';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganization, deleteOrganization, getMembership, updateOrganization } from './organizations.services';

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

export function useCurrentUserRole({ organizationId }: { organizationId?: string } = {}) {
  const params = useParams();

  const getOrganizationId = () => organizationId ?? params.organizationId;

  const query = useQuery(() => ({
    queryKey: ['organizations', getOrganizationId(), 'members', 'me'],
    queryFn: () => getMembership({ organizationId: getOrganizationId() }),
  }));

  const getRole = () => query.data?.member.role;
  const getIsMember = () => getRole() === ORGANIZATION_ROLES.MEMBER;
  const getIsAdmin = () => getRole() === ORGANIZATION_ROLES.ADMIN;
  const getIsOwner = () => getRole() === ORGANIZATION_ROLES.OWNER;
  const getIsAtLeastAdmin = () => getIsAdmin() || getIsOwner();

  return {
    query,
    getRole,
    getIsMember,
    getIsAdmin,
    getIsOwner,
    getIsAtLeastAdmin,
  };
}
