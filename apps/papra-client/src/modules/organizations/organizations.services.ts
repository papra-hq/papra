import type { AsDto } from '../shared/http/http-client.types';
import type { Organization, OrganizationMember, OrganizationMemberRole } from './organizations.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function inviteOrganizationMember({ organizationId, email, role }: { organizationId: string; email: string; role: OrganizationMemberRole }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/members/invitations`,
    method: 'POST',
    body: { email, role },
  });
}

export async function fetchOrganizations() {
  const { organizations } = await apiClient<{ organizations: AsDto<Organization>[] }>({
    path: '/api/organizations',
    method: 'GET',
  });

  return {
    organizations: organizations.map(coerceDates),
  };
}

export async function createOrganization({ name }: { name: string }) {
  const { organization } = await apiClient<{ organization: AsDto<Organization> }>({
    path: '/api/organizations',
    method: 'POST',
    body: { name },
  });

  return {
    organization: coerceDates(organization),
  };
}

export async function updateOrganization({ organizationId, name }: { organizationId: string; name: string }) {
  const { organization } = await apiClient<{ organization: AsDto<Organization> }>({
    path: `/api/organizations/${organizationId}`,
    method: 'PUT',
    body: { name },
  });

  return {
    organization: coerceDates(organization),
  };
}

export async function fetchOrganization({ organizationId }: { organizationId: string }) {
  const { organization } = await apiClient<{ organization: AsDto<Organization> }>({
    path: `/api/organizations/${organizationId}`,
    method: 'GET',
  });

  return {
    organization: coerceDates(organization),
  };
}

export async function deleteOrganization({ organizationId }: { organizationId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}`,
    method: 'DELETE',
  });
}

export async function fetchOrganizationMembers({ organizationId }: { organizationId: string }) {
  const { members } = await apiClient<{ members: AsDto<OrganizationMember>[] }>({
    path: `/api/organizations/${organizationId}/members`,
    method: 'GET',
  });

  return {
    members: members.map(({ user, ...rest }) => coerceDates({ user: coerceDates(user), ...rest })),
  };
}

export async function removeOrganizationMember({ organizationId, memberId }: { organizationId: string; memberId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/members/${memberId}`,
    method: 'DELETE',
  });
}

export async function getMembership({ organizationId }: { organizationId: string }) {
  const { member } = await apiClient<{ member: AsDto<OrganizationMember> }>({
    path: `/api/organizations/${organizationId}/members/me`,
    method: 'GET',
  });

  return {
    member: coerceDates(member),
  };
}
