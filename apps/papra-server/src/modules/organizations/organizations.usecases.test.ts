import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createUserNotInOrganizationError } from './organizations.errors';
import { createOrganizationsRepository } from './organizations.repository';
import { ensureUserIsInOrganization } from './organizations.usecases';

describe('organizations usecases', () => {
  describe('ensureUserIsInOrganization', () => {
    describe('checks if user is in organization and the organization exists, an error is thrown if the user is not in the organization', async () => {
      test('the user is in the organization and the organization exists', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationUsers: [{ organizationId: 'organization-1', userId: 'user-1' }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });

        await expect(
          ensureUserIsInOrganization({
            userId: 'user-1',
            organizationId: 'organization-1',
            organizationsRepository,
          }),
        ).resolves.not.toThrow();
      });

      test('the user is not in the organization', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });

        await expect(
          ensureUserIsInOrganization({
            userId: 'user-1',
            organizationId: 'organization-1',
            organizationsRepository,
          }),
        ).rejects.toThrow(createUserNotInOrganizationError());
      });

      test('the organization does not exist', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });

        await expect(
          ensureUserIsInOrganization({
            userId: 'user-1',
            organizationId: 'organization-1',
            organizationsRepository,
          }),
        ).rejects.toThrow(createUserNotInOrganizationError());
      });
    });
  });
});
