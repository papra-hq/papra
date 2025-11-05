import type { ORGANIZATION_INVITATION_STATUS_LIST, ORGANIZATION_ROLES_LIST } from './organizations.constants';

export type OrganizationRole = typeof ORGANIZATION_ROLES_LIST[number];

export type OrganizationInvitationStatus = typeof ORGANIZATION_INVITATION_STATUS_LIST[number];
