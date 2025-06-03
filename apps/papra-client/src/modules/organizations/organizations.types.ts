import type { User } from 'better-auth/types';
import type { ORGANIZATION_INVITATION_STATUS_LIST } from './organizations.constants';

export type Organization = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  user: User;
  role: OrganizationMemberRole;
};

export type OrganizationMemberRole = 'owner' | 'admin' | 'member';

export type OrganizationInvitationStatus = typeof ORGANIZATION_INVITATION_STATUS_LIST[number];

export type OrganizationInvitation = {
  id: string;
  organizationId: string;
  email: string;
  status: OrganizationInvitationStatus;
  role: OrganizationMemberRole;
  createdAt: Date;
};
