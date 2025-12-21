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

      const invitations = await db.select().from(organizationInvitationsTable).orderBy(organizationInvitationsTable.id);

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

      const remainingMembers = await db.select().from(organizationMembersTable);

      expect(remainingMembers).to.have.lengthOf(1);
      expect(remainingMembers[0]?.organizationId).to.equal('org_2');
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

      const remainingInvitations = await db.select().from(organizationInvitationsTable);

      expect(remainingInvitations).to.have.lengthOf(1);
      expect(remainingInvitations[0]?.organizationId).to.equal('org_2');
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

      const [organization] = await db.select().from(organizationsTable);

      expect(organization?.deletedAt).to.eql(now);
      expect(organization?.deletedBy).to.equal('user_1');
      expect(organization?.scheduledPurgeAt).to.eql(expectedPurgeDate);
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

      const [organization] = await db.select().from(organizationsTable);

      expect(organization?.scheduledPurgeAt).to.eql(expectedPurgeDate);
    });
  });

  describe('getOrganizationCount', () => {
    test('when no organizations exist in the database, the count is zero', async () => {
      const { db } = await createInMemoryDatabase();
      const { getOrganizationCount } = createOrganizationsRepository({ db });

      const { organizationCount } = await getOrganizationCount();

      expect(organizationCount).to.equal(0);
    });

    test('when multiple organizations exist in the database, the count reflects the total number of organizations', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' },
          { id: 'org_3', name: 'Org 3' },
        ],
      });

      const { getOrganizationCount } = createOrganizationsRepository({ db });

      const { organizationCount } = await getOrganizationCount();

      expect(organizationCount).to.equal(3);
    });

    test('when some organizations are soft-deleted, they are excluded from the count', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user1@test.com' }],
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2', deletedAt: new Date('2025-05-15'), deletedBy: 'user_1', scheduledPurgeAt: new Date('2025-06-15') },
          { id: 'org_3', name: 'Org 3' },
        ],
      });

      const { getOrganizationCount } = createOrganizationsRepository({ db });

      const { organizationCount } = await getOrganizationCount();

      expect(organizationCount).to.equal(2);
    });
  });

  describe('listOrganizations', () => {
    test('when no organizations exist, an empty list is returned', async () => {
      const { db } = await createInMemoryDatabase();
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({});

      expect(result).to.deep.equal({
        organizations: [],
        totalCount: 0,
        pageIndex: 0,
        pageSize: 25,
      });
    });

    test('when multiple organizations exist, all organizations are returned with member counts', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user_1', email: 'user1@example.com', name: 'User 1' },
          { id: 'user_2', email: 'user2@example.com', name: 'User 2' },
        ],
        organizations: [
          { id: 'org_1', name: 'Alpha Corp', createdAt: new Date('2025-01-02') },
          { id: 'org_2', name: 'Beta LLC', createdAt: new Date('2025-01-01') },
        ],
        organizationMembers: [
          { userId: 'user_1', organizationId: 'org_1', role: 'owner' },
          { userId: 'user_2', organizationId: 'org_1', role: 'member' },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({});

      expect(result.organizations).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.pageIndex).to.equal(0);
      expect(result.pageSize).to.equal(25);

      expect(
        result.organizations.map(org => ({
          id: org.id,
          name: org.name,
          memberCount: org.memberCount,
        })),
      ).to.deep.equal([
        { id: 'org_1', name: 'Alpha Corp', memberCount: 2 },
        { id: 'org_2', name: 'Beta LLC', memberCount: 0 },
      ]);
    });

    test('when searching by organization ID, only the exact matching organization is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Alpha Corp' },
          { id: 'org_abcdefghijklmnopqrstuvwx', name: 'Beta LLC' },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({ search: 'org_abcdefghijklmnopqrstuvwx' });

      expect(result.organizations).to.have.length(1);
      expect(result.organizations[0]?.id).to.equal('org_abcdefghijklmnopqrstuvwx');
      expect(result.totalCount).to.equal(1);
    });

    test('when searching by partial name, matching organizations are returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Alpha Corporation', createdAt: new Date('2025-01-02') },
          { id: 'org_2', name: 'Beta LLC', createdAt: new Date('2025-01-03') },
          { id: 'org_3', name: 'Alpha Industries', createdAt: new Date('2025-01-01') },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({ search: 'Alpha' });

      expect(result.organizations).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.organizations.map(org => org.name)).to.deep.equal([
        'Alpha Corporation',
        'Alpha Industries',
      ]);
    });

    test('when searching with an empty string, all organizations are returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Alpha Corp' },
          { id: 'org_2', name: 'Beta LLC' },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({ search: '   ' });

      expect(result.organizations).to.have.length(2);
      expect(result.totalCount).to.equal(2);
    });

    test('when using pagination, only the requested page is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Org 1' },
          { id: 'org_2', name: 'Org 2' },
          { id: 'org_3', name: 'Org 3' },
          { id: 'org_4', name: 'Org 4' },
          { id: 'org_5', name: 'Org 5' },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const firstPage = await listOrganizations({ pageIndex: 0, pageSize: 2 });
      const secondPage = await listOrganizations({ pageIndex: 1, pageSize: 2 });

      expect(firstPage.organizations).to.have.length(2);
      expect(firstPage.totalCount).to.equal(5);
      expect(secondPage.organizations).to.have.length(2);
      expect(secondPage.totalCount).to.equal(5);
      expect(firstPage.organizations[0]?.id).to.not.equal(secondPage.organizations[0]?.id);
    });

    test('when searching with pagination, the total count reflects the search results', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_1', name: 'Tech Corp 1' },
          { id: 'org_2', name: 'Tech Corp 2' },
          { id: 'org_3', name: 'Tech Corp 3' },
          { id: 'org_4', name: 'Media LLC' },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({ search: 'Tech', pageIndex: 0, pageSize: 2 });

      expect(result.organizations).to.have.length(2);
      expect(result.totalCount).to.equal(3);
    });

    test('when soft-deleted organizations exist, they are excluded from the results', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'user1@test.com' }],
        organizations: [
          { id: 'org_1', name: 'Active Org', createdAt: new Date('2025-01-02') },
          { id: 'org_2', name: 'Deleted Org', createdAt: new Date('2025-01-03'), deletedAt: new Date('2025-05-15'), deletedBy: 'user_1', scheduledPurgeAt: new Date('2025-06-15') },
          { id: 'org_3', name: 'Another Active Org', createdAt: new Date('2025-01-01') },
        ],
      });
      const { listOrganizations } = createOrganizationsRepository({ db });

      const result = await listOrganizations({});

      expect(result.organizations).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.organizations.map(org => org.name)).to.deep.equal([
        'Active Org',
        'Another Active Org',
      ]);
    });
  });
});
