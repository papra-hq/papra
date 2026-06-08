import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { accountsTable, sessionsTable, twoFactorTable } from '../app/auth/auth.tables';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { organizationMembersTable, organizationsTable } from '../organizations/organizations.table';
import { createUsersNotFoundError, createUserStillOwnsOrganizationsError } from './users.errors';
import { createUsersRepository } from './users.repository';
import { deleteUser } from './users.usecases';

describe('users usecases', () => {
  describe('deleteUser', () => {
    test('deletes the user', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
      });

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await deleteUser({ userId: 'user-1', usersRepository, organizationsRepository });

      const { user } = await usersRepository.getUserById({ userId: 'user-1' });

      expect(user).toBeUndefined();
    });

    test('cascades the user organization memberships', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.MEMBER },
          { organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await deleteUser({ userId: 'user-1', usersRepository, organizationsRepository });

      const members = await db
        .select()
        .from(organizationMembersTable)
        .where(eq(organizationMembersTable.userId, 'user-1'));

      expect(members).toEqual([]);
    });

    test('deleting an user cascades the authentication related data, accounts, sessions, 2fa, ...', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        accounts: [
          { id: 'account-1', accountId: 'account-1', providerId: 'email', userId: 'user-1' },
        ],
        sessions: [
          {
            id: 'session-1',
            token: 'lorem-ipsum',
            userId: 'user-1',
            expiresAt: new Date('2050-01-01'),
          },
        ],
        twoFactor: [{ id: '2fa-1', userId: 'user-1', secret: 'super-secret' }],
      });

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await deleteUser({ userId: 'user-1', usersRepository, organizationsRepository });

      const [accounts, sessions, twoFactor] = await Promise.all([
        db.select().from(accountsTable),
        db.select().from(sessionsTable),
        db.select().from(twoFactorTable),
      ]);

      expect(accounts).toEqual([]);
      expect(sessions).toEqual([]);
      expect(twoFactor).toEqual([]);
    });

    test('nulls the organizations.deleted_by reference instead of blocking the delete', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        // The user soft-deleted this organization, but is no longer a member of it
        organizations: [
          {
            id: 'organization-1',
            name: 'Organization 1',
            deletedAt: new Date(),
            deletedBy: 'user-1',
          },
        ],
      });

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await deleteUser({ userId: 'user-1', usersRepository, organizationsRepository });

      const [organization] = await db
        .select()
        .from(organizationsTable)
        .where(eq(organizationsTable.id, 'organization-1'));

      expect(organization).toBeDefined();
      expect(organization?.deletedBy).toBeNull();
    });

    test('throws an error when the user still owns an organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await expect(
        deleteUser({ userId: 'user-1', usersRepository, organizationsRepository }),
      ).rejects.toThrow(createUserStillOwnsOrganizationsError());

      const { user } = await usersRepository.getUserById({ userId: 'user-1' });

      expect(user).toBeDefined();
    });

    test('throws an error when the user does not exist', async () => {
      const { db } = await createInMemoryDatabase({});

      const usersRepository = createUsersRepository({ db });
      const organizationsRepository = createOrganizationsRepository({ db });

      await expect(
        deleteUser({ userId: 'unknown-user', usersRepository, organizationsRepository }),
      ).rejects.toThrow(createUsersNotFoundError());
    });
  });
});
