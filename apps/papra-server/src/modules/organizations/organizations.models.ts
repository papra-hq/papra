import type {
  DbInsertableOrganization,
  DbInsertableOrganizationInvitation,
  DbInsertableOrganizationMember,
  DbSelectableOrganization,
  DbSelectableOrganizationInvitation,
  DbSelectableOrganizationMember,
  InsertableOrganization,
  InsertableOrganizationInvitation,
  InsertableOrganizationMember,
  Organization,
  OrganizationInvitation,
  OrganizationMember,
} from './organizations.tables';
import type { OrganizationRole } from './organizations.types';
import { generateId } from '../shared/random/ids';
import { isNil } from '../shared/utils';
import {
  ORGANIZATION_ID_PREFIX,
  ORGANIZATION_INVITATION_ID_PREFIX,
  ORGANIZATION_MEMBER_ID_PREFIX,
  ORGANIZATION_ROLES,
} from './organizations.constants';

const generateOrganizationId = () => generateId({ prefix: ORGANIZATION_ID_PREFIX });
const generateOrganizationMemberId = () => generateId({ prefix: ORGANIZATION_MEMBER_ID_PREFIX });
const generateOrganizationInvitationId = () => generateId({ prefix: ORGANIZATION_INVITATION_ID_PREFIX });

export function canUserRemoveMemberFromOrganization({
  userRole,
  memberRole,
}: {
  userRole: OrganizationRole;
  memberRole: OrganizationRole;
}) {
  if (memberRole === ORGANIZATION_ROLES.OWNER) {
    return false;
  }

  if (![ORGANIZATION_ROLES.ADMIN, ORGANIZATION_ROLES.OWNER].includes(userRole)) {
    return false;
  }

  return true;
}

// DB <-> Business model transformers

// Organization transformers

export function dbToOrganization(dbOrganization?: DbSelectableOrganization): Organization | undefined {
  if (!dbOrganization) {
    return undefined;
  }

  return {
    id: dbOrganization.id,
    name: dbOrganization.name,
    customerId: dbOrganization.customer_id,
    deletedBy: dbOrganization.deleted_by,
    createdAt: new Date(dbOrganization.created_at),
    updatedAt: new Date(dbOrganization.updated_at),
    deletedAt: isNil(dbOrganization.deleted_at) ? null : new Date(dbOrganization.deleted_at),
    scheduledPurgeAt: isNil(dbOrganization.scheduled_purge_at) ? null : new Date(dbOrganization.scheduled_purge_at),
  };
}

export function organizationToDb(
  organization: InsertableOrganization,
  {
    now = new Date(),
    generateId = generateOrganizationId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableOrganization {
  return {
    id: organization.id ?? generateId(),
    name: organization.name,
    customer_id: organization.customerId,
    deleted_by: organization.deletedBy,
    created_at: organization.createdAt?.getTime() ?? now.getTime(),
    updated_at: organization.updatedAt?.getTime() ?? now.getTime(),
    deleted_at: organization.deletedAt?.getTime(),
    scheduled_purge_at: organization.scheduledPurgeAt?.getTime(),
  };
}

// Organization Member transformers

export function dbToOrganizationMember(dbMember: undefined): undefined;
export function dbToOrganizationMember(dbMember: DbSelectableOrganizationMember): OrganizationMember;
export function dbToOrganizationMember(dbMember?: DbSelectableOrganizationMember): OrganizationMember | undefined {
  if (!dbMember) {
    return undefined;
  }

  return {
    id: dbMember.id,
    organizationId: dbMember.organization_id,
    userId: dbMember.user_id,
    role: dbMember.role as 'owner' | 'admin' | 'member',
    createdAt: new Date(dbMember.created_at),
    updatedAt: new Date(dbMember.updated_at),
  };
}

export function organizationMemberToDb(
  member: InsertableOrganizationMember,
  {
    now = new Date(),
    generateId = generateOrganizationMemberId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableOrganizationMember {
  return {
    id: member.id ?? generateId(),
    organization_id: member.organizationId,
    user_id: member.userId,
    role: member.role,
    created_at: member.createdAt?.getTime() ?? now.getTime(),
    updated_at: member.updatedAt?.getTime() ?? now.getTime(),
  };
}

// Organization Invitation transformers

export function dbToOrganizationInvitation(dbInvitation?: DbSelectableOrganizationInvitation): OrganizationInvitation | undefined {
  if (!dbInvitation) {
    return undefined;
  }

  return {
    id: dbInvitation.id,
    organizationId: dbInvitation.organization_id,
    email: dbInvitation.email,
    role: dbInvitation.role as 'owner' | 'admin' | 'member',
    status: dbInvitation.status as 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled',
    inviterId: dbInvitation.inviter_id,
    createdAt: new Date(dbInvitation.created_at),
    updatedAt: new Date(dbInvitation.updated_at),
    expiresAt: new Date(dbInvitation.expires_at),
  };
}

export function organizationInvitationToDb(
  invitation: InsertableOrganizationInvitation,
  {
    now = new Date(),
    generateId = generateOrganizationInvitationId,
  }: {
    now?: Date;
    generateId?: () => string;
  } = {},
): DbInsertableOrganizationInvitation {
  return {
    id: invitation.id ?? generateId(),
    organization_id: invitation.organizationId,
    email: invitation.email,
    role: invitation.role,
    status: invitation.status,
    inviter_id: invitation.inviterId,
    created_at: invitation.createdAt?.getTime() ?? now.getTime(),
    updated_at: invitation.updatedAt?.getTime() ?? now.getTime(),
    expires_at: invitation.expiresAt.getTime(),
  };
}
