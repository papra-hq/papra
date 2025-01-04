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
});
