import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createUserAlreadyExistsError } from './users.errors';
import { createUsersRepository } from './users.repository';

describe('users repository', () => {
  describe('createUser', () => {
    test('when a user already exists with the same email, an error is thrown', async () => {
      const { db } = await createInMemoryDatabase();
      const { createUser } = createUsersRepository({ db });

      const email = 'jon.doe@example.com';
      await createUser({ user: { email } });

      try {
        await createUser({ user: { email } });
        expect.fail('An error should have been thrown');
      } catch (error) {
        expect(error).to.deep.equal(createUserAlreadyExistsError());
      }
    });
  });

  describe('getUserCount', () => {
    test('when no users exist in the database, the count is zero', async () => {
      const { db } = await createInMemoryDatabase();
      const { getUserCount } = createUsersRepository({ db });

      const { userCount } = await getUserCount();

      expect(userCount).to.equal(0);
    });

    test('when multiple users exist in the database, the count reflects the total number of users', async () => {
      const { db } = await createInMemoryDatabase();
      const { createUser, getUserCount } = createUsersRepository({ db });

      await createUser({ user: { email: 'user1@example.com' } });
      await createUser({ user: { email: 'user2@example.com' } });
      await createUser({ user: { email: 'user3@example.com' } });

      const { userCount } = await getUserCount();

      expect(userCount).to.equal(3);
    });
  });

  describe('listUsers', () => {
    test('when no users exist, an empty list is returned', async () => {
      const { db } = await createInMemoryDatabase();
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({});

      expect(result).to.deep.equal({
        users: [],
        totalCount: 0,
        pageIndex: 0,
        pageSize: 25,
      });
    });

    test('when multiple users exist, all users are returned with organization counts', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'alice@example.com', name: 'Alice', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'bob@example.com', name: 'Bob', createdAt: new Date('2025-01-02') },
        ],
        organizations: [
          { id: 'org_1', name: 'Org 1' },
        ],
        organizationMembers: [
          { userId: 'usr_1', organizationId: 'org_1', role: 'owner' },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({});

      expect(result.users).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.pageIndex).to.equal(0);
      expect(result.pageSize).to.equal(25);

      expect(
        result.users.map(u => ({
          id: u.id,
          email: u.email,
          organizationCount: u.organizationCount,
        })),
      ).to.deep.equal([
        { id: 'usr_2', email: 'bob@example.com', organizationCount: 0 },
        { id: 'usr_1', email: 'alice@example.com', organizationCount: 1 },
      ]);
    });

    test('when searching by user ID, only the exact matching user is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_123456789012345678901234', email: 'alice@example.com', name: 'Alice', createdAt: new Date('2025-01-01') },
          { id: 'usr_abcdefghijklmnopqrstuvwx', email: 'bob@example.com', name: 'Bob', createdAt: new Date('2025-01-02') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({ search: 'usr_abcdefghijklmnopqrstuvwx' });

      expect(result.users).to.have.length(1);
      expect(result.users[0]?.id).to.equal('usr_abcdefghijklmnopqrstuvwx');
      expect(result.totalCount).to.equal(1);
    });

    test('when searching by partial email, matching users are returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'alice@example.com', name: 'Alice', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'bob@example.com', name: 'Bob', createdAt: new Date('2025-01-02') },
          { id: 'usr_3', email: 'alice.smith@test.com', name: 'Alice Smith', createdAt: new Date('2025-01-03') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({ search: 'alice' });

      expect(result.users).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.users.map(u => u.email)).to.deep.equal([
        'alice.smith@test.com',
        'alice@example.com',
      ]);
    });

    test('when searching by partial name, matching users are returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'alice@example.com', name: 'Alice Johnson', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'bob@example.com', name: 'Bob Smith', createdAt: new Date('2025-01-02') },
          { id: 'usr_3', email: 'charlie@example.com', name: 'Charlie Johnson', createdAt: new Date('2025-01-03') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({ search: 'Johnson' });

      expect(result.users).to.have.length(2);
      expect(result.totalCount).to.equal(2);
      expect(result.users.map(u => u.name)).to.deep.equal([
        'Charlie Johnson',
        'Alice Johnson',
      ]);
    });

    test('when searching with an empty string, all users are returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'alice@example.com', name: 'Alice', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'bob@example.com', name: 'Bob', createdAt: new Date('2025-01-02') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({ search: '   ' });

      expect(result.users).to.have.length(2);
      expect(result.totalCount).to.equal(2);
    });

    test('when using pagination, only the requested page is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'user1@example.com', name: 'User 1', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'user2@example.com', name: 'User 2', createdAt: new Date('2025-01-02') },
          { id: 'usr_3', email: 'user3@example.com', name: 'User 3', createdAt: new Date('2025-01-03') },
          { id: 'usr_4', email: 'user4@example.com', name: 'User 4', createdAt: new Date('2025-01-04') },
          { id: 'usr_5', email: 'user5@example.com', name: 'User 5', createdAt: new Date('2025-01-05') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const firstPage = await listUsers({ pageIndex: 0, pageSize: 2 });
      const secondPage = await listUsers({ pageIndex: 1, pageSize: 2 });

      expect(firstPage.users).to.have.length(2);
      expect(firstPage.totalCount).to.equal(5);
      expect(secondPage.users).to.have.length(2);
      expect(secondPage.totalCount).to.equal(5);
      expect(firstPage.users[0]?.id).to.not.equal(secondPage.users[0]?.id);
    });

    test('when searching with pagination, the total count reflects the search results', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'alice1@example.com', name: 'Alice 1', createdAt: new Date('2025-01-01') },
          { id: 'usr_2', email: 'alice2@example.com', name: 'Alice 2', createdAt: new Date('2025-01-02') },
          { id: 'usr_3', email: 'alice3@example.com', name: 'Alice 3', createdAt: new Date('2025-01-03') },
          { id: 'usr_4', email: 'bob@example.com', name: 'Bob', createdAt: new Date('2025-01-04') },
        ],
      });
      const { listUsers } = createUsersRepository({ db });

      const result = await listUsers({ search: 'alice', pageIndex: 0, pageSize: 2 });

      expect(result.users).to.have.length(2);
      expect(result.totalCount).to.equal(3);
    });
  });
});
