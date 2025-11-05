import type { DatabaseClient } from '../app/database/database.types';
import type { OrganizationInvitationStatus, OrganizationRole } from './organizations.types';
import { injectArguments } from '@corentinth/chisels';
import { addDays, startOfDay } from 'date-fns';
import { sql } from 'kysely';
import { omitUndefined } from '../shared/utils';
import { ORGANIZATION_INVITATION_STATUS, ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationNotFoundError } from './organizations.errors';
import { ensureInvitationStatus } from './organizations.repository.models';
import { dbToOrganization, dbToOrganizationInvitation, dbToOrganizationMember, organizationInvitationToDb, organizationMemberToDb, organizationToDb } from './organizations.models';
import type { DbInsertableOrganization } from './organizations.tables';

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>;

export function createOrganizationsRepository({ db }: { db: DatabaseClient }) {
  return injectArguments(
    {
      saveOrganization,
      getUserOrganizations,
      addUserToOrganization,
      isUserInOrganization,
      updateOrganization,
      deleteOrganization,
      getOrganizationById,
      getUserOwnedOrganizationCount,
      getOrganizationOwner,
      getOrganizationMembersCount,
      getAllOrganizationIds,
      getOrganizationMembers,
      removeUserFromOrganization,
      updateOrganizationMemberRole,
      getOrganizationMemberByUserId,
      getOrganizationMemberByMemberId,
      saveOrganizationInvitation,
      getTodayUserInvitationCount,
      getPendingOrganizationInvitationsForEmail,
      getOrganizationInvitationById,
      updateOrganizationInvitation,
      getPendingInvitationsCount,
      getInvitationForEmailAndOrganization,
      getOrganizationMemberByEmail,
      getOrganizationInvitations,
      updateExpiredPendingInvitationsStatus,
      getOrganizationPendingInvitationsCount,
      deleteAllMembersFromOrganization,
      deleteAllOrganizationInvitations,
      softDeleteOrganization,
      restoreOrganization,
      getUserDeletedOrganizations,
      getExpiredSoftDeletedOrganizations,
    },
    { db },
  );
}

async function saveOrganization({ organization: organizationToInsert, db }: { organization: DbInsertableOrganization; db: DatabaseClient }) {
  const dbOrganization = await db
    .insertInto('organizations')
    .values(organizationToInsert)
    .returningAll()
    .executeTakeFirst();

  if (!dbOrganization) {
    // This should never happen, as the database should always return the inserted organization
    // guard for type safety
    throw new Error('Failed to save organization');
  }

  const organization = dbToOrganization(dbOrganization);

  return { organization };
}

async function getUserOrganizations({ userId, db }: { userId: string; db: DatabaseClient }) {
  const dbOrganizations = await db
    .selectFrom('organizations')
    .innerJoin('organization_members', 'organizations.id', 'organization_members.organization_id')
    .where('organization_members.user_id', '=', userId)
    .where('organizations.deleted_at', 'is', null)
    .select([
      'organizations.id',
      'organizations.name',
      'organizations.customer_id',
      'organizations.deleted_at',
      'organizations.deleted_by',
      'organizations.scheduled_purge_at',
      'organizations.created_at',
      'organizations.updated_at',
    ])
    .execute();

  return {
    organizations: dbOrganizations.map(dbOrg => dbToOrganization(dbOrg)).filter((org): org is NonNullable<typeof org> => org !== undefined),
  };
}

async function addUserToOrganization({ userId, organizationId, role, db }: { userId: string; organizationId: string; role: OrganizationRole; db: DatabaseClient }) {
  await db
    .insertInto('organization_members')
    .values(organizationMemberToDb({ userId, organizationId, role }))
    .execute();
}

async function isUserInOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: DatabaseClient }) {
  const member = await db
    .selectFrom('organization_members')
    .where('user_id', '=', userId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  return {
    isInOrganization: member !== undefined,
  };
}

async function updateOrganization({ organizationId, organization: organizationToUpdate, db }: { organizationId: string; organization: { name?: string; customerId?: string }; db: DatabaseClient }) {
  const updateValues = omitUndefined({
    name: organizationToUpdate.name,
    customer_id: organizationToUpdate.customerId,
  });

  const dbOrganization = await db
    .updateTable('organizations')
    .set(updateValues)
    .where('id', '=', organizationId)
    .returningAll()
    .executeTakeFirst();

  return { organization: dbToOrganization(dbOrganization) };
}

async function deleteOrganization({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('organizations')
    .where('id', '=', organizationId)
    .execute();
}

async function getOrganizationById({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const dbOrganization = await db
    .selectFrom('organizations')
    .where('id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  return {
    organization: dbToOrganization(dbOrganization),
  };
}

async function getUserOwnedOrganizationCount({ userId, db }: { userId: string; db: DatabaseClient }) {
  const result = await db
    .selectFrom('organization_members')
    .select(sql<number>`count(*)`.as('organization_count'))
    .where('user_id', '=', userId)
    .where('role', '=', ORGANIZATION_ROLES.OWNER)
    .executeTakeFirst();

  if (!result) {
    throw createOrganizationNotFoundError();
  }

  const organizationCount = result.organization_count;

  return {
    organizationCount,
  };
}

async function getOrganizationOwner({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const organizationOwner = await db
    .selectFrom('users')
    .innerJoin('organization_members', 'users.id', 'organization_members.user_id')
    .where('organization_members.organization_id', '=', organizationId)
    .where('organization_members.role', '=', ORGANIZATION_ROLES.OWNER)
    .select([
      'users.id',
      'users.email',
      'users.email_verified',
      'users.name',
      'users.image',
      'users.max_organization_count',
      'users.created_at',
      'users.updated_at',
    ])
    .executeTakeFirst();

  if (!organizationOwner) {
    throw createOrganizationNotFoundError();
  }

  return { organizationOwner };
}

async function getOrganizationMembersCount({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const result = await db
    .selectFrom('organization_members')
    .select(sql<number>`count(*)`.as('members_count'))
    .where('organization_id', '=', organizationId)
    .executeTakeFirst();

  if (!result) {
    throw createOrganizationNotFoundError();
  }

  const membersCount = result.members_count;

  return {
    membersCount,
  };
}

async function getAllOrganizationIds({ db }: { db: DatabaseClient }) {
  const results = await db
    .selectFrom('organizations')
    .select('id')
    .execute();

  return {
    organizationIds: results.map(({ id }) => id),
  };
}

async function getOrganizationMembers({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const results = await db
    .selectFrom('organization_members')
    .leftJoin('users', 'organization_members.user_id', 'users.id')
    .where('organization_members.organization_id', '=', organizationId)
    .select([
      'organization_members.id',
      'organization_members.organization_id',
      'organization_members.user_id',
      'organization_members.role',
      'organization_members.created_at',
      'organization_members.updated_at',
      'users.id as user_id_col',
      'users.email',
      'users.email_verified',
      'users.name',
      'users.image',
      'users.max_organization_count',
      'users.created_at as user_created_at',
      'users.updated_at as user_updated_at',
    ])
    .execute();

  return {
    members: results.map((result) => {
      const member = {
        id: result.id,
        organization_id: result.organization_id,
        user_id: result.user_id,
        role: result.role,
        created_at: result.created_at,
        updated_at: result.updated_at,
      };

      const user = result.user_id_col
        ? {
            id: result.user_id_col,
            email: result.email!,
            email_verified: result.email_verified!,
            name: result.name!,
            image: result.image!,
            max_organization_count: result.max_organization_count!,
            created_at: result.user_created_at!,
            updated_at: result.user_updated_at!,
          }
        : null;

      return {
        ...member,
        user,
      };
    }),
  };
}

async function removeUserFromOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('organization_members')
    .where('user_id', '=', userId)
    .where('organization_id', '=', organizationId)
    .execute();
}

async function updateOrganizationMemberRole({ memberId, role, db }: { memberId: string; role: OrganizationRole; db: DatabaseClient }) {
  const dbMember = await db
    .updateTable('organization_members')
    .set({ role })
    .where('id', '=', memberId)
    .returningAll()
    .executeTakeFirst();

  if (!dbMember) {
    return { member: undefined };
  }

  return { member: dbToOrganizationMember(dbMember) };
}

async function getOrganizationMemberByUserId({ userId, organizationId, db }: { userId: string; organizationId: string; db: DatabaseClient }) {
  const dbMember = await db
    .selectFrom('organization_members')
    .where('user_id', '=', userId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  if (!dbMember) {
    return { member: undefined };
  }

  return { member: dbToOrganizationMember(dbMember) };
}

async function getOrganizationMemberByMemberId({ memberId, organizationId, db }: { memberId: string; organizationId: string; db: DatabaseClient }) {
  const dbMember = await db
    .selectFrom('organization_members')
    .where('id', '=', memberId)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  if (!dbMember) {
    return { member: undefined };
  }

  return { member: dbToOrganizationMember(dbMember) };
}

async function saveOrganizationInvitation({
  organizationId,
  email,
  role,
  inviterId,
  db,
  expirationDelayDays = 7,
  now = new Date(),
}: {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  inviterId: string;
  db: DatabaseClient;
  expirationDelayDays?: number;
  now?: Date;
}) {
  const dbInvitation = await db
    .insertInto('organization_invitations')
    .values(organizationInvitationToDb({
      organizationId,
      email,
      role,
      inviterId,
      status: ORGANIZATION_INVITATION_STATUS.PENDING,
      expiresAt: addDays(now, expirationDelayDays),
    }, { now }))
    .returningAll()
    .executeTakeFirst();

  return { organizationInvitation: dbToOrganizationInvitation(dbInvitation) };
}

async function getTodayUserInvitationCount({ userId, db, now = new Date() }: { userId: string; db: DatabaseClient; now?: Date }) {
  const result = await db
    .selectFrom('organization_invitations')
    .select(sql<number>`count(*)`.as('user_invitation_count'))
    .where('inviter_id', '=', userId)
    .where('created_at', '>=', startOfDay(now).getTime())
    .executeTakeFirst();

  if (!result) {
    throw createOrganizationNotFoundError();
  }

  const userInvitationCount = result.user_invitation_count;

  return {
    userInvitationCount,
  };
}

async function getPendingOrganizationInvitationsForEmail({ email, db, now = new Date() }: { email: string; db: DatabaseClient; now?: Date }) {
  const results = await db
    .selectFrom('organization_invitations')
    .leftJoin('organizations', 'organization_invitations.organization_id', 'organizations.id')
    .where('organization_invitations.email', '=', email)
    .where('organization_invitations.status', '=', ORGANIZATION_INVITATION_STATUS.PENDING)
    .where('organization_invitations.expires_at', '>=', now.getTime())
    .select([
      'organization_invitations.id',
      'organization_invitations.organization_id',
      'organization_invitations.email',
      'organization_invitations.role',
      'organization_invitations.status',
      'organization_invitations.inviter_id',
      'organization_invitations.expires_at',
      'organization_invitations.created_at',
      'organization_invitations.updated_at',
      'organizations.id as org_id',
      'organizations.name',
      'organizations.customer_id',
      'organizations.deleted_at',
      'organizations.deleted_by',
      'organizations.scheduled_purge_at',
      'organizations.created_at as org_created_at',
      'organizations.updated_at as org_updated_at',
    ])
    .execute();

  const invitations = results.map((result) => {
    const invitation = {
      id: result.id,
      organization_id: result.organization_id,
      email: result.email,
      role: result.role,
      status: result.status,
      inviter_id: result.inviter_id,
      expires_at: result.expires_at,
      created_at: result.created_at,
      updated_at: result.updated_at,
    };

    const organization = result.org_id
      ? {
          id: result.org_id,
          name: result.name!,
          customer_id: result.customer_id!,
          deleted_at: result.deleted_at!,
          deleted_by: result.deleted_by!,
          scheduled_purge_at: result.scheduled_purge_at!,
          created_at: result.org_created_at!,
          updated_at: result.org_updated_at!,
        }
      : null;

    return {
      ...invitation,
      organization,
    };
  });

  return {
    invitations,
  };
}

async function getOrganizationInvitationById({ invitationId, db, now = new Date() }: { invitationId: string; db: DatabaseClient; now?: Date }) {
  const dbInvitation = await db
    .selectFrom('organization_invitations')
    .where('id', '=', invitationId)
    .selectAll()
    .executeTakeFirst();

  const invitation = dbToOrganizationInvitation(dbInvitation);

  return {
    invitation: ensureInvitationStatus({ invitation, now }),
  };
}

async function updateOrganizationInvitation({ invitationId, status, expiresAt, db }: { invitationId: string; status: OrganizationInvitationStatus; expiresAt?: Date; db: DatabaseClient }) {
  await db
    .updateTable('organization_invitations')
    .set(omitUndefined({
      status,
      expires_at: expiresAt?.getTime(),
    }))
    .where('id', '=', invitationId)
    .execute();
}

async function getPendingInvitationsCount({ email, db, now = new Date() }: { email: string; db: DatabaseClient; now?: Date }) {
  const result = await db
    .selectFrom('organization_invitations')
    .select(sql<number>`count(*)`.as('pending_invitations_count'))
    .where('email', '=', email)
    .where('status', '=', ORGANIZATION_INVITATION_STATUS.PENDING)
    .where('expires_at', '>=', now.getTime())
    .executeTakeFirst();

  if (!result) {
    throw createOrganizationNotFoundError();
  }

  const pendingInvitationsCount = result.pending_invitations_count;

  return {
    pendingInvitationsCount,
  };
}

async function getInvitationForEmailAndOrganization({ email, organizationId, db, now = new Date() }: { email: string; organizationId: string; db: DatabaseClient; now?: Date }) {
  const dbInvitation = await db
    .selectFrom('organization_invitations')
    .where('email', '=', email)
    .where('organization_id', '=', organizationId)
    .selectAll()
    .executeTakeFirst();

  const invitation = dbToOrganizationInvitation(dbInvitation);

  return {
    invitation: ensureInvitationStatus({ invitation, now }),
  };
}

async function getOrganizationMemberByEmail({ email, organizationId, db }: { email: string; organizationId: string; db: DatabaseClient }) {
  const dbMember = await db
    .selectFrom('organization_members')
    .innerJoin('users', 'organization_members.user_id', 'users.id')
    .where('users.email', '=', email)
    .where('organization_members.organization_id', '=', organizationId)
    .select([
      'organization_members.id',
      'organization_members.organization_id',
      'organization_members.user_id',
      'organization_members.role',
      'organization_members.created_at',
      'organization_members.updated_at',
    ])
    .executeTakeFirst();

  if (!dbMember) {
    return { member: undefined };
  }

  return {
    member: dbToOrganizationMember(dbMember),
  };
}

async function getOrganizationInvitations({ organizationId, db, now = new Date() }: { organizationId: string; db: DatabaseClient; now?: Date }) {
  const dbInvitations = await db
    .selectFrom('organization_invitations')
    .where('organization_id', '=', organizationId)
    .selectAll()
    .execute();

  const invitations = dbInvitations
    .map(dbInv => dbToOrganizationInvitation(dbInv))
    .filter((inv): inv is NonNullable<typeof inv> => inv !== undefined)
    .map(invitation => ensureInvitationStatus({ invitation, now }))
    .filter((inv): inv is NonNullable<typeof inv> => inv !== null);

  return { invitations };
}

async function updateExpiredPendingInvitationsStatus({ db, now = new Date() }: { db: DatabaseClient; now?: Date }) {
  await db
    .updateTable('organization_invitations')
    .set({ status: ORGANIZATION_INVITATION_STATUS.EXPIRED })
    .where('expires_at', '<=', now.getTime())
    .where('status', '=', ORGANIZATION_INVITATION_STATUS.PENDING)
    .execute();
}

async function getOrganizationPendingInvitationsCount({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  const result = await db
    .selectFrom('organization_invitations')
    .select(sql<number>`count(*)`.as('pending_invitations_count'))
    .where('organization_id', '=', organizationId)
    .where('status', '=', ORGANIZATION_INVITATION_STATUS.PENDING)
    .executeTakeFirst();

  if (!result) {
    throw createOrganizationNotFoundError();
  }

  const pendingInvitationsCount = result.pending_invitations_count;

  return {
    pendingInvitationsCount,
  };
}

async function deleteAllMembersFromOrganization({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('organization_members')
    .where('organization_id', '=', organizationId)
    .execute();
}

async function deleteAllOrganizationInvitations({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  await db
    .deleteFrom('organization_invitations')
    .where('organization_id', '=', organizationId)
    .execute();
}

async function softDeleteOrganization({ organizationId, deletedBy, db, now = new Date(), purgeDaysDelay = 30 }: { organizationId: string; deletedBy: string; db: DatabaseClient; now?: Date; purgeDaysDelay?: number }) {
  await db
    .updateTable('organizations')
    .set({
      deleted_at: now.getTime(),
      deleted_by: deletedBy,
      scheduled_purge_at: addDays(now, purgeDaysDelay).getTime(),
    })
    .where('id', '=', organizationId)
    .execute();
}

async function restoreOrganization({ organizationId, db }: { organizationId: string; db: DatabaseClient }) {
  await db
    .updateTable('organizations')
    .set({
      deleted_at: null,
      deleted_by: null,
      scheduled_purge_at: null,
    })
    .where('id', '=', organizationId)
    .execute();
}

async function getUserDeletedOrganizations({ userId, db, now = new Date() }: { userId: string; db: DatabaseClient; now?: Date }) {
  const dbOrganizations = await db
    .selectFrom('organizations')
    .where('deleted_by', '=', userId)
    .where('deleted_at', 'is not', null)
    .where('scheduled_purge_at', '>=', now.getTime())
    .selectAll()
    .execute();

  return {
    organizations: dbOrganizations.map(dbOrg => dbToOrganization(dbOrg)).filter((org): org is NonNullable<typeof org> => org !== undefined),
  };
}

async function getExpiredSoftDeletedOrganizations({ db, now = new Date() }: { db: DatabaseClient; now?: Date }) {
  const organizations = await db
    .selectFrom('organizations')
    .where('deleted_at', 'is not', null)
    .where('scheduled_purge_at', '<=', now.getTime())
    .select('id')
    .execute();

  return {
    organizationIds: organizations.map(org => org.id),
  };
}
