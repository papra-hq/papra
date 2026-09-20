import { createNoopLogger } from '@crowlog/logger';
import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { setupDatabase } from '../../modules/app/database/database';
import {
  createInMemoryDatabase,
  seedDatabase,
} from '../../modules/app/database/database.test-utils';
import { organizationInvitationsTable } from '../../modules/organizations/organizations.table';
import { migrations } from '../migrations.registry';
import { runMigrations } from '../migrations.usecases';
import { pendingOrganizationInvitationsUniqueMigration } from './0028-pending-organization-invitations-unique.migration';

describe('pending organization invitations unique migration', () => {
  test('existing accepted invitations are preserved and no longer block new invitations after upgrading', async () => {
    const { db } = setupDatabase({ url: ':memory:' });
    await runMigrations({
      db,
      migrations: migrations.slice(
        0,
        migrations.indexOf(pendingOrganizationInvitationsUniqueMigration),
      ),
      logger: createNoopLogger(),
    });
    const invitation = {
      organizationId: 'org',
      email: 'member@example.com',
      inviterId: 'owner',
      role: 'member' as const,
      expiresAt: new Date('2025-10-12'),
    };
    await seedDatabase({
      db,
      users: [{ id: 'owner', email: 'owner@example.com' }],
      organizations: [
        { id: 'org', name: 'Organization' },
        { id: 'other-org', name: 'Other organization' },
      ],
      organizationInvitations: [{ ...invitation, id: 'accepted', status: 'accepted' }],
    });
    const [acceptedInvitation] = await db.select().from(organizationInvitationsTable);

    await expect(
      db
        .insert(organizationInvitationsTable)
        .values({ ...invitation, id: 'pending', status: 'pending' }),
    ).rejects.toThrow();

    await pendingOrganizationInvitationsUniqueMigration.up({ db });
    await pendingOrganizationInvitationsUniqueMigration.up({ db });

    await db
      .insert(organizationInvitationsTable)
      .values({ ...invitation, id: 'pending', status: 'pending' });
    await expect(
      db
        .insert(organizationInvitationsTable)
        .values({ ...invitation, id: 'duplicate', status: 'pending' }),
    ).rejects.toThrow();
    await db.insert(organizationInvitationsTable).values({
      ...invitation,
      id: 'other-org-invitation',
      organizationId: 'other-org',
      status: 'pending',
    });

    const invitations = await db
      .select()
      .from(organizationInvitationsTable)
      .orderBy(organizationInvitationsTable.id);
    expect(invitations).toHaveLength(3);
    expect(invitations[0]).toEqual(acceptedInvitation);
  });

  test('rollback discards invitation history while preserving pending invitations and restoring uniqueness', async () => {
    const invitation = {
      organizationId: 'org',
      email: 'member@example.com',
      inviterId: 'owner',
      role: 'member' as const,
      expiresAt: new Date('2025-10-12'),
    };
    const { db } = await createInMemoryDatabase({
      users: [{ id: 'owner', email: 'owner@example.com' }],
      organizations: [
        { id: 'org', name: 'Organization' },
        { id: 'other-org', name: 'Other organization' },
      ],
      organizationInvitations: [
        { ...invitation, id: 'accepted', status: 'accepted' },
        { ...invitation, id: 'cancelled', status: 'cancelled' },
        { ...invitation, id: 'expired', status: 'expired' },
        { ...invitation, id: 'rejected', status: 'rejected' },
        { ...invitation, id: 'pending', status: 'pending' },
        { ...invitation, id: 'other-pending', organizationId: 'other-org', status: 'pending' },
        { ...invitation, id: 'history-only', email: 'other@example.com', status: 'accepted' },
      ],
    });
    const pendingInvitations = await db
      .select()
      .from(organizationInvitationsTable)
      .where(eq(organizationInvitationsTable.status, 'pending'))
      .orderBy(organizationInvitationsTable.id);

    await pendingOrganizationInvitationsUniqueMigration.down({ db });

    expect(
      await db.select().from(organizationInvitationsTable).orderBy(organizationInvitationsTable.id),
    ).toEqual(pendingInvitations);

    await expect(
      db
        .insert(organizationInvitationsTable)
        .values({ ...invitation, id: 'duplicate', status: 'accepted' }),
    ).rejects.toThrow();

    await pendingOrganizationInvitationsUniqueMigration.up({ db });

    await db
      .insert(organizationInvitationsTable)
      .values({ ...invitation, id: 'new-history', status: 'accepted' });
    expect(await db.select().from(organizationInvitationsTable)).toHaveLength(3);
  });
});
