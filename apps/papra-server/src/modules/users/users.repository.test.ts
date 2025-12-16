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
});
