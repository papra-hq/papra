import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationInvitationsTable, organizationMembersTable, organizationsTable } from './organizations.table';

describe('organizations repository', () => {
  describe('updateExpiredPendingInvitationsStatus', () => {
    test('the pending invitations that are expired (expiredAt < now) are updated to expired', async () => {
      const commonInvitation = {
        organizationId: 'org_1',
        role: 'member',
        inviterId: 'user_1',
        createdAt: new Date('2025-05-05'),
        updatedAt: new Date('2025-05-05'),
      } as const;

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user_1@test.com' }],
        organizations: [{ id: 'org_1', name: 'Test Organization' }],
        organizationInvitations: [
          {
            id: 'invitation_1',
            expiresAt: new Date('2025-05-12'),
            status: 'pending',
            email: 'test-1@test.com',
            ...commonInvitation,
          },
          {
            id: 'invitation_2',
            expiresAt: new Date('2025-05-14'),
            status: 'pending',
            email: 'test-2@test.com',
            ...commonInvitation,
          },
          {
            id: 'invitation_3',
            expiresAt: new Date('2025-05-05'),
            status: 'accepted',
            email: 'test-3@test.com',
            ...commonInvitation,
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await organizationsRepository.updateExpiredPendingInvitationsStatus({ now: new Date('2025-05-13') });

      const invitations = await db.selectFrom('organization_invitations').selectAll().orderBy('id', 'asc').execute();

      expect(invitations).to.eql([
        {
          id: 'invitation_1',
          status: 'expired',
          expiresAt: new Date('2025-05-12'),
          email: 'test-1@test.com',
          ...commonInvitation,
        },
        {
          id: 'invitation_2',
          status: 'pending',
          expiresAt: new Date('2025-05-14'),
          email: 'test-2@test.com',
          ...commonInvitation,
        },
        {
          id: 'invitation_3',
          status: 'accepted',
          expiresAt: new Date('2025-05-05'),
          email: 'test-3@test.com',
          ...commonInvitation,
        },
      ]);
    });
  });

  describe('deleteAllMembersFromOrganization', () => {
    test('deletes all members from the specified organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user_1', email: 'user1@test.com' },
          { id: 'user_2', email: 'user2@test.com' },
          { id: 'user_3', email: 'user3@test.com' },
        ],
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' },
        ],
        organizationMembers: [
          { id: 'member_1', organizationId: 'org_1', userId: 'user_1', role: 'owner' },
          { id: 'member_2', organizationId: 'org_1', userId: 'user_2', role: 'member' },
          { id: 'member_3', organizationId: 'org_2', userId: 'user_3', role: 'owner' },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await organizationsRepository.deleteAllMembersFromOrganization({ organizationId: 'org_1' });

      const remainingMembers = await db.selectFrom('organization_members').selectAll().execute();

      expect(remainingMembers).to.have.lengthOf(1);
      expect(remainingMembers[0]?.organization_id).to.equal('org_2');
    });
  });

  describe('deleteAllOrganizationInvitations', () => {
    test('deletes all invitations for the specified organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user1@test.com' }],
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' },
        ],
        organizationInvitations: [
          {
            id: 'invite_1',
            organizationId: 'org_1',
            email: 'invite1@test.com',
            role: 'member',
            inviterId: 'user_1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
          },
          {
            id: 'invite_2',
            organizationId: 'org_1',
            email: 'invite2@test.com',
            role: 'admin',
            inviterId: 'user_1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
          },
          {
            id: 'invite_3',
            organizationId: 'org_2',
            email: 'invite3@test.com',
            role: 'member',
            inviterId: 'user_1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await organizationsRepository.deleteAllOrganizationInvitations({ organizationId: 'org_1' });

      const remainingInvitations = await db.selectFrom('organization_invitations').selectAll().execute();

      expect(remainingInvitations).to.have.lengthOf(1);
      expect(remainingInvitations[0]?.organization_id).to.equal('org_2');
    });
  });

  describe('softDeleteOrganization', () => {
    test('marks organization as deleted with deletedAt, deletedBy, and scheduledPurgeAt', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user1@test.com' }],
        organizations: [
          { id: 'org_1', name: 'Org to Delete' },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      const now = new Date('2025-05-15T10:00:00Z');
      const expectedPurgeDate = new Date('2025-06-14T10:00:00Z'); // 30 days later

      await organizationsRepository.softDeleteOrganization({
        organizationId: 'org_1',
        deletedBy: 'user_1',
        now,
        purgeDaysDelay: 30,
      });

      const [organization] = await db.selectFrom('organizations').selectAll().execute();

      expect(organization?.deleted_at).to.eql(now.getTime());
      expect(organization?.deleted_by).to.equal('user_1');
      expect(organization?.scheduled_purge_at).to.eql(expectedPurgeDate.getTime());
    });

    test('uses default purge delay of 30 days when not specified', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user1@test.com' }],
        organizations: [
          { id: 'org_1', name: 'Org to Delete' },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      const now = new Date('2025-05-15T10:00:00Z');
      const expectedPurgeDate = new Date('2025-06-14T10:00:00Z'); // 30 days later by default

      await organizationsRepository.softDeleteOrganization({
        organizationId: 'org_1',
        deletedBy: 'user_1',
        now,
      });

      const [organization] = await db.selectFrom('organizations').selectAll().execute();

      expect(organization?.scheduled_purge_at).to.eql(expectedPurgeDate.getTime());
    });
  });
});
