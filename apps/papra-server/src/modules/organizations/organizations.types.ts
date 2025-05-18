import type { Expand } from '@corentinth/chisels';
import type { ORGANIZATION_INVITATION_STATUS_LIST, ORGANIZATION_ROLES_LIST } from './organizations.constants';
import type { organizationsTable } from './organizations.table';

export type DbInsertableOrganization = Expand<typeof organizationsTable.$inferInsert>;

export type OrganizationRole = typeof ORGANIZATION_ROLES_LIST[number];

export type OrganizationInvitationStatus = typeof ORGANIZATION_INVITATION_STATUS_LIST[number];
