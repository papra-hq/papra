import type { User } from 'better-auth/types';

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
