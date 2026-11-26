import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { documentsTable } from '../../documents/documents.table';
import {
  createOnlyPreviousOwnerCanRestoreError,
  createOrganizationHasActiveSubscriptionError,
  createOrganizationNotFoundError,
} from '../../organizations/organizations.errors';
import { createOrganizationsRepository } from '../../organizations/organizations.repository';
import {
  organizationInvitationsTable,
  organizationMembersTable,
  organizationsTable,
} from '../../organizations/organizations.table';
import { restoreOrganization } from '../../organizations/organizations.usecases';
import { createTestClock } from '../../shared/clock/clock.test-utils';
import { createSubscriptionsRepository } from '../../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../../users/users.repository';
import { usersTable } from '../../users/users.table';
import { deleteUser } from '../../users/users.usecases';
import { buildAdminSoftDeleteOrganization } from './organizations.usecases';

const organizationId = 'organization-1';
const ownerId = 'owner';
const adminId = 'admin';

describe('buildAdminSoftDeleteOrganization', () => {
  test('deleting an empty organization records the admin, schedules its purge, and allows deleting its owner', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
      organizationInvitations: [
        {
          organizationId,
          email: 'invitee@example.com',
          role: 'member',
          inviterId: ownerId,
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
      ],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const organizationsRepository = createOrganizationsRepository({ db });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository,
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    clock.advanceBy({ hours: 24 });

    await softDeleteOrganization({ organizationId, deletedBy: adminId });

    const organizations = await db.select().from(organizationsTable);
    const members = await db.select().from(organizationMembersTable);
    const invitations = await db.select().from(organizationInvitationsTable);
    expect(organizations[0]).toMatchObject({
      id: organizationId,
      deletedBy: adminId,
      deletedAt: new Date('2026-05-13T00:00:00Z'),
      scheduledPurgeAt: new Date('2026-05-20T00:00:00Z'),
    });
    expect(members).toEqual([]);
    expect(invitations).toEqual([]);

    await deleteUser({
      userId: ownerId,
      organizationsRepository,
      usersRepository: createUsersRepository({ db }),
    });

    expect(await db.select().from(usersTable).where(eq(usersTable.id, ownerId))).toEqual([]);
  });

  test('a shared, non-empty organization can be deleted without affecting its documents or other organizations', async () => {
    const otherOrganizationId = 'organization-2';
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
        { id: 'member', email: 'member@example.com' },
      ],
      organizations: [
        { id: organizationId, name: 'Test organization' },
        { id: otherOrganizationId, name: 'Other' },
      ],
      organizationMembers: [
        { organizationId, userId: ownerId, role: 'owner' },
        { organizationId, userId: 'member', role: 'member' },
        { organizationId: otherOrganizationId, userId: 'member', role: 'owner' },
      ],
      organizationInvitations: [
        {
          organizationId,
          email: 'invitee@example.com',
          role: 'member',
          inviterId: ownerId,
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
        {
          organizationId: otherOrganizationId,
          email: 'other-invitee@example.com',
          role: 'member',
          inviterId: 'member',
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
      ],
      documents: [
        {
          organizationId,
          name: 'Document',
          originalName: 'document.pdf',
          originalStorageKey: 'document.pdf',
          originalSha256Hash: 'hash',
          mimeType: 'application/pdf',
        },
      ],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository: createOrganizationsRepository({ db }),
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    const before = {
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    };
    const documentsBefore = await db.select().from(documentsTable);

    await softDeleteOrganization({ organizationId, deletedBy: adminId });

    const organizations = await db.select().from(organizationsTable);
    const members = await db.select().from(organizationMembersTable);
    const invitations = await db.select().from(organizationInvitationsTable);
    expect(organizations.find(({ id }) => id === organizationId)).toMatchObject({
      deletedBy: adminId,
      deletedAt: new Date('2026-05-12T00:00:00Z'),
    });
    expect(organizations.find(({ id }) => id === otherOrganizationId)).toEqual(
      before.organizations.find(({ id }) => id === otherOrganizationId),
    );
    expect(members).toEqual(
      before.members.filter(({ organizationId }) => organizationId === otherOrganizationId),
    );
    expect(invitations).toEqual(
      before.invitations.filter(({ organizationId }) => organizationId === otherOrganizationId),
    );
    expect(await db.select().from(documentsTable)).toEqual(documentsBefore);
  });

  test('a blocking subscription leaves the organization, memberships, and invitations unchanged', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
      organizationInvitations: [
        {
          organizationId,
          email: 'invitee@example.com',
          role: 'member',
          inviterId: ownerId,
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
      ],
      organizationSubscriptions: [
        {
          id: 'sub_test',
          organizationId,
          customerId: 'cus_test',
          planId: 'pro',
          status: 'active',
          seatsCount: 2,
          currentPeriodStart: new Date('2026-05-01'),
          currentPeriodEnd: new Date('2026-06-01'),
          cancelAtPeriodEnd: false,
        },
      ],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository: createOrganizationsRepository({ db }),
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    const before = {
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    };

    await expect(softDeleteOrganization({ organizationId, deletedBy: adminId })).rejects.toThrow(
      createOrganizationHasActiveSubscriptionError(),
    );

    expect({
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    }).toEqual(before);
  });

  test('a subscription scheduled to cancel does not block deletion', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
      organizationInvitations: [
        {
          organizationId,
          email: 'invitee@example.com',
          role: 'member',
          inviterId: ownerId,
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
      ],
      organizationSubscriptions: [
        {
          id: 'sub_test',
          organizationId,
          customerId: 'cus_test',
          planId: 'pro',
          status: 'active',
          seatsCount: 2,
          currentPeriodStart: new Date('2026-05-01'),
          currentPeriodEnd: new Date('2026-06-01'),
          cancelAtPeriodEnd: true,
        },
      ],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository: createOrganizationsRepository({ db }),
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });

    await softDeleteOrganization({ organizationId, deletedBy: adminId });

    const organizations = await db.select().from(organizationsTable);
    const members = await db.select().from(organizationMembersTable);
    const invitations = await db.select().from(organizationInvitationsTable);
    expect(organizations[0]).toMatchObject({
      deletedBy: adminId,
      deletedAt: new Date('2026-05-12T00:00:00Z'),
      scheduledPurgeAt: new Date('2026-05-19T00:00:00Z'),
    });
    expect(members).toEqual([]);
    expect(invitations).toEqual([]);
  });

  test('deleting an already-deleted organization preserves its original actor and purge deadline', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
        { id: 'another-admin', email: 'another-admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository: createOrganizationsRepository({ db }),
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    await softDeleteOrganization({ organizationId, deletedBy: adminId });
    const before = {
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    };
    clock.advanceBy({ hours: 48 });

    await softDeleteOrganization({ organizationId, deletedBy: 'another-admin' });

    expect({
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    }).toEqual(before);
  });

  test('a missing organization raises a not-found error without changing existing organizations', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
      organizationInvitations: [
        {
          organizationId,
          email: 'invitee@example.com',
          role: 'member',
          inviterId: ownerId,
          status: 'pending',
          expiresAt: new Date('2026-06-01'),
        },
      ],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository: createOrganizationsRepository({ db }),
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    const before = {
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    };

    await expect(
      softDeleteOrganization({ organizationId: 'missing', deletedBy: adminId }),
    ).rejects.toThrow(createOrganizationNotFoundError());

    expect({
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    }).toEqual(before);
  });

  test('the previous owner cannot restore an organization deleted by an admin', async () => {
    const { db } = await createInMemoryDatabase({
      users: [
        { id: ownerId, email: 'owner@example.com' },
        { id: adminId, email: 'admin@example.com' },
      ],
      organizations: [{ id: organizationId, name: 'Test organization' }],
      organizationMembers: [{ organizationId, userId: ownerId, role: 'owner' }],
    });
    const { clock } = createTestClock({ now: '2026-05-12T00:00:00Z' });
    const organizationsRepository = createOrganizationsRepository({ db });
    const softDeleteOrganization = buildAdminSoftDeleteOrganization({
      organizationsRepository,
      subscriptionsRepository: createSubscriptionsRepository({ db }),
      config: overrideConfig({ organizations: { deletedOrganizationsPurgeDaysDelay: 7 } }),
      clock,
    });
    await softDeleteOrganization({ organizationId, deletedBy: adminId });
    const before = {
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    };

    await expect(
      restoreOrganization({
        organizationId,
        restoredBy: ownerId,
        organizationsRepository,
        now: new Date('2026-05-13T00:00:00Z'),
      }),
    ).rejects.toThrow(createOnlyPreviousOwnerCanRestoreError());

    expect({
      organizations: await db.select().from(organizationsTable),
      members: await db.select().from(organizationMembersTable),
      invitations: await db.select().from(organizationInvitationsTable),
    }).toEqual(before);
  });
});
