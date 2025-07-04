import type { Database } from '../app/database/database.types';
import type { DbInsertableOrganization, OrganizationInvitationStatus, OrganizationRole } from './organizations.types';
import { injectArguments } from '@corentinth/chisels';
import { addDays, startOfDay } from 'date-fns';
import { and, count, eq, getTableColumns, gte, lte } from 'drizzle-orm';
import { omit } from 'lodash-es';
import { omitUndefined } from '../shared/utils';
import { usersTable } from '../users/users.table';
import { ORGANIZATION_INVITATION_STATUS, ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationNotFoundError } from './organizations.errors';
import { ensureInvitationStatus } from './organizations.repository.models';
import { organizationInvitationsTable, organizationMembersTable, organizationsTable } from './organizations.table';

export type OrganizationsRepository = ReturnType<typeof createOrganizationsRepository>;

export function createOrganizationsRepository({ db }: { db: Database }) {
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
    },
    { db },
  );
}

async function saveOrganization({ organization: organizationToInsert, db }: { organization: DbInsertableOrganization; db: Database }) {
  const [organization] = await db.insert(organizationsTable).values(organizationToInsert).returning();

  if (!organization) {
    // This should never happen, as the database should always return the inserted organization
    // guard for type safety
    throw new Error('Failed to save organization');
  }

  return { organization };
}

async function getUserOrganizations({ userId, db }: { userId: string; db: Database }) {
  const organizations = await db
    .select({
      organization: getTableColumns(organizationsTable),
    })
    .from(organizationsTable)
    .leftJoin(organizationMembersTable, eq(organizationsTable.id, organizationMembersTable.organizationId))
    .where(eq(organizationMembersTable.userId, userId));

  return {
    organizations: organizations.map(({ organization }) => organization),
  };
}

async function addUserToOrganization({ userId, organizationId, role, db }: { userId: string; organizationId: string; role: OrganizationRole; db: Database }) {
  await db.insert(organizationMembersTable).values({ userId, organizationId, role });
}

async function isUserInOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: Database }) {
  const organizationUser = await db
    .select()
    .from(organizationMembersTable)
    .where(and(
      eq(organizationMembersTable.userId, userId),
      eq(organizationMembersTable.organizationId, organizationId),
    ));

  return {
    isInOrganization: organizationUser.length > 0,
  };
}

async function updateOrganization({ organizationId, organization: organizationToUpdate, db }: { organizationId: string; organization: { name?: string; customerId?: string }; db: Database }) {
  const [organization] = await db
    .update(organizationsTable)
    .set(omitUndefined(organizationToUpdate))
    .where(eq(organizationsTable.id, organizationId))
    .returning();

  return { organization };
}

async function deleteOrganization({ organizationId, db }: { organizationId: string; db: Database }) {
  await db.delete(organizationsTable).where(eq(organizationsTable.id, organizationId));
}

async function getOrganizationById({ organizationId, db }: { organizationId: string; db: Database }) {
  const [organization] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, organizationId));

  return {
    organization,
  };
}

async function getUserOwnedOrganizationCount({ userId, db }: { userId: string; db: Database }) {
  const [record] = await db
    .select({
      organizationCount: count(organizationMembersTable.id),
    })
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.userId, userId),
        eq(organizationMembersTable.role, ORGANIZATION_ROLES.OWNER),
      ),
    );

  if (!record) {
    throw createOrganizationNotFoundError();
  }

  const { organizationCount } = record;

  return {
    organizationCount,
  };
}

async function getOrganizationOwner({ organizationId, db }: { organizationId: string; db: Database }) {
  const [record] = await db
    .select({
      organizationOwner: getTableColumns(usersTable),
    })
    .from(usersTable)
    .leftJoin(organizationMembersTable, eq(usersTable.id, organizationMembersTable.userId))
    .where(
      and(
        eq(organizationMembersTable.organizationId, organizationId),
        eq(organizationMembersTable.role, ORGANIZATION_ROLES.OWNER),
      ),
    );

  if (!record) {
    throw createOrganizationNotFoundError();
  }

  const { organizationOwner } = record;

  return { organizationOwner };
}

async function getOrganizationMembersCount({ organizationId, db }: { organizationId: string; db: Database }) {
  const [record] = await db
    .select({
      membersCount: count(organizationMembersTable.id),
    })
    .from(organizationMembersTable)
    .where(
      eq(organizationMembersTable.organizationId, organizationId),
    );

  if (!record) {
    throw createOrganizationNotFoundError();
  }

  const { membersCount } = record;

  return {
    membersCount,
  };
}

async function getAllOrganizationIds({ db }: { db: Database }) {
  const organizationIds = await db.select({ id: organizationsTable.id }).from(organizationsTable);

  return {
    organizationIds: organizationIds.map(({ id }) => id),
  };
}

async function getOrganizationMembers({ organizationId, db }: { organizationId: string; db: Database }) {
  const members = await db
    .select()
    .from(organizationMembersTable)
    .leftJoin(usersTable, eq(organizationMembersTable.userId, usersTable.id))
    .where(
      eq(organizationMembersTable.organizationId, organizationId),
    );

  return {
    members: members.map(({ organization_members, users }) => ({
      ...organization_members,
      user: users,
    })),
  };
}

async function removeUserFromOrganization({ userId, organizationId, db }: { userId: string; organizationId: string; db: Database }) {
  await db
    .delete(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.userId, userId),
        eq(organizationMembersTable.organizationId, organizationId),
      ),
    );
}

async function updateOrganizationMemberRole({ memberId, role, db }: { memberId: string; role: OrganizationRole; db: Database }) {
  const [updatedMember] = await db
    .update(organizationMembersTable)
    .set({ role })
    .where(
      eq(organizationMembersTable.id, memberId),
    )
    .returning();

  return { member: updatedMember };
}

async function getOrganizationMemberByUserId({ userId, organizationId, db }: { userId: string; organizationId: string; db: Database }) {
  const [member] = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.userId, userId),
        eq(organizationMembersTable.organizationId, organizationId),
      ),
    );

  return { member };
}

async function getOrganizationMemberByMemberId({ memberId, organizationId, db }: { memberId: string; organizationId: string; db: Database }) {
  const [member] = await db
    .select()
    .from(organizationMembersTable)
    .where(
      and(
        eq(organizationMembersTable.id, memberId),
        eq(organizationMembersTable.organizationId, organizationId),
      ),
    );

  return { member };
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
  db: Database;
  expirationDelayDays?: number;
  now?: Date;
}) {
  const [organizationInvitation] = await db
    .insert(organizationInvitationsTable)
    .values({
      organizationId,
      email,
      role,
      inviterId,
      status: ORGANIZATION_INVITATION_STATUS.PENDING,
      expiresAt: addDays(now, expirationDelayDays),
    })
    .returning();

  return { organizationInvitation };
}

async function getTodayUserInvitationCount({ userId, db, now = new Date() }: { userId: string; db: Database; now?: Date }) {
  const [record] = await db
    .select({
      userInvitationCount: count(organizationInvitationsTable.id),
    })
    .from(organizationInvitationsTable)
    .where(
      and(
        eq(organizationInvitationsTable.inviterId, userId),
        gte(organizationInvitationsTable.createdAt, startOfDay(now)),
      ),
    );

  if (!record) {
    throw createOrganizationNotFoundError();
  }

  const { userInvitationCount } = record;

  return {
    userInvitationCount,
  };
}

async function getPendingOrganizationInvitationsForEmail({ email, db, now = new Date() }: { email: string; db: Database; now?: Date }) {
  const rawInvitations = await db
    .select()
    .from(organizationInvitationsTable)
    .leftJoin(organizationsTable, eq(organizationInvitationsTable.organizationId, organizationsTable.id))
    .where(
      and(
        eq(organizationInvitationsTable.email, email),
        eq(organizationInvitationsTable.status, ORGANIZATION_INVITATION_STATUS.PENDING),
        // To ensure we don't count just expired invitations that haven't been marked as expired yet
        gte(organizationInvitationsTable.expiresAt, now),
      ),
    );

  const invitations = rawInvitations.map(({ organization_invitations, organizations }) => ({
    ...omit(organization_invitations, ''),
    organization: organizations,
  }));

  return {
    invitations,
  };
}

async function getOrganizationInvitationById({ invitationId, db, now = new Date() }: { invitationId: string; db: Database; now?: Date }) {
  const [invitation] = await db
    .select()
    .from(organizationInvitationsTable)
    .where(
      eq(organizationInvitationsTable.id, invitationId),
    );

  return {
    invitation: ensureInvitationStatus({ invitation, now }),
  };
}

async function updateOrganizationInvitation({ invitationId, status, expiresAt, db }: { invitationId: string; status: OrganizationInvitationStatus; expiresAt?: Date; db: Database }) {
  await db
    .update(organizationInvitationsTable)
    .set(omitUndefined({
      status,
      expiresAt,
    }))
    .where(
      eq(organizationInvitationsTable.id, invitationId),
    );
}

async function getPendingInvitationsCount({ email, db, now = new Date() }: { email: string; db: Database; now?: Date }) {
  const [record] = await db
    .select({
      pendingInvitationsCount: count(organizationInvitationsTable.id),
    })
    .from(organizationInvitationsTable)
    .where(
      and(
        eq(organizationInvitationsTable.email, email),
        eq(organizationInvitationsTable.status, ORGANIZATION_INVITATION_STATUS.PENDING),
        // To ensure we don't count just expired invitations that haven't been marked as expired yet
        gte(organizationInvitationsTable.expiresAt, now),
      ),
    );

  if (!record) {
    throw createOrganizationNotFoundError();
  }

  const { pendingInvitationsCount } = record;

  return {
    pendingInvitationsCount,
  };
}

async function getInvitationForEmailAndOrganization({ email, organizationId, db, now = new Date() }: { email: string; organizationId: string; db: Database; now?: Date }) {
  const [invitation] = await db
    .select()
    .from(organizationInvitationsTable)
    .where(
      and(
        eq(organizationInvitationsTable.email, email),
        eq(organizationInvitationsTable.organizationId, organizationId),
      ),
    );

  return {
    invitation: ensureInvitationStatus({ invitation, now }),
  };
}

async function getOrganizationMemberByEmail({ email, organizationId, db }: { email: string; organizationId: string; db: Database }) {
  const [rawMember] = await db
    .select()
    .from(organizationMembersTable)
    .leftJoin(usersTable, eq(organizationMembersTable.userId, usersTable.id))
    .where(
      and(
        eq(usersTable.email, email),
        eq(organizationMembersTable.organizationId, organizationId),
      ),
    );

  return {
    member: rawMember ? rawMember.organization_members : null,
  };
}

async function getOrganizationInvitations({ organizationId, db, now = new Date() }: { organizationId: string; db: Database; now?: Date }) {
  const invitations = await db
    .select()
    .from(organizationInvitationsTable)
    .where(eq(organizationInvitationsTable.organizationId, organizationId));

  return { invitations: invitations.map(invitation => ensureInvitationStatus({ invitation, now })) };
}

async function updateExpiredPendingInvitationsStatus({ db, now = new Date() }: { db: Database; now?: Date }) {
  await db
    .update(organizationInvitationsTable)
    .set({ status: ORGANIZATION_INVITATION_STATUS.EXPIRED })
    .where(
      and(
        lte(organizationInvitationsTable.expiresAt, now),
        eq(organizationInvitationsTable.status, ORGANIZATION_INVITATION_STATUS.PENDING),
      ),
    );
}
