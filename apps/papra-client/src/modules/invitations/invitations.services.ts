import type { Organization } from '../organizations/organizations.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchInvitations() {
  const { invitations } = await apiClient<{ invitations: { id: string; organization: Organization }[] }>({
    path: '/api/invitations',
    method: 'GET',
  });

  return {
    invitations: invitations.map(i => ({
      ...coerceDates(i),
      organization: coerceDates(i.organization),
    })),
  };
}

export async function fetchPendingInvitationsCount() {
  const { pendingInvitationsCount } = await apiClient<{ pendingInvitationsCount: number }>({
    path: '/api/invitations/count',
    method: 'GET',
  });

  return { pendingInvitationsCount };
}

export async function acceptInvitation({ invitationId }: { invitationId: string }) {
  await apiClient({
    path: `/api/invitations/${invitationId}/accept`,
    method: 'POST',
  });
}

export async function rejectInvitation({ invitationId }: { invitationId: string }) {
  await apiClient({
    path: `/api/invitations/${invitationId}/reject`,
    method: 'POST',
  });
}

export async function resendInvitation({ invitationId }: { invitationId: string }) {
  await apiClient({
    path: `/api/invitations/${invitationId}/resend`,
    method: 'POST',
  });
}

export async function cancelInvitation({ invitationId }: { invitationId: string }) {
  await apiClient({
    path: `/api/invitations/${invitationId}/cancel`,
    method: 'POST',
  });
}
