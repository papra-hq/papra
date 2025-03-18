import type { PlansRepository } from '../plans/plans.repository';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { PLUS_PLAN_ID } from '../plans/plans.constants';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationDocumentStorageLimitReachedError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError } from './organizations.errors';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationMembersTable, organizationsTable } from './organizations.table';
import { checkIfOrganizationCanCreateNewDocument, checkIfUserCanCreateNewOrganization, ensureUserIsInOrganization } from './organizations.usecases';

describe('organizations usecases', () => {
  describe('ensureUserIsInOrganization', () => {
    describe('checks if user is in organization and the organization exists, an error is thrown if the user is not in the organization', async () => {
      test('the user is in the organization and the organization exists', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
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

  describe('checkIfUserCanCreateNewOrganization', () => {
    test('by default the maximum number of organizations a user can create is defined in the config, if the user has reached the limit an error is thrown', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          // This organization is not owned by user-1
          { id: 'organization-2', name: 'Organization 2' },
        ],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { organizationId: 'organization-2', userId: 'user-1', role: ORGANIZATION_ROLES.MEMBER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });
      const config = overrideConfig({ organizations: { maxOrganizationCount: 2 } });

      // no throw
      await checkIfUserCanCreateNewOrganization({
        userId: 'user-1',
        config,
        organizationsRepository,
        usersRepository,
      });

      // add a second organization owned by the user
      await db.insert(organizationsTable).values({ id: 'organization-3', name: 'Organization 3' });
      await db.insert(organizationMembersTable).values({ organizationId: 'organization-3', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER });

      // throw
      await expect(
        checkIfUserCanCreateNewOrganization({
          userId: 'user-1',
          config,
          organizationsRepository,
          usersRepository,
        }),
      ).rejects.toThrow(
        createUserMaxOrganizationCountReachedError(),
      );
    });

    test('an admin can individually allow a user to create more organizations by setting the maxOrganizationCount on the user', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com', maxOrganizationCount: 3 }],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { organizationId: 'organization-2', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const usersRepository = createUsersRepository({ db });
      const config = overrideConfig({ organizations: { maxOrganizationCount: 2 } });

      // no throw
      await checkIfUserCanCreateNewOrganization({
        userId: 'user-1',
        config,
        organizationsRepository,
        usersRepository,
      });

      // add a third organization owned by the user
      await db.insert(organizationsTable).values({ id: 'organization-3', name: 'Organization 3' });
      await db.insert(organizationMembersTable).values({ organizationId: 'organization-3', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER });

      // throw
      await expect(
        checkIfUserCanCreateNewOrganization({
          userId: 'user-1',
          config,
          organizationsRepository,
          usersRepository,
        }),
      ).rejects.toThrow(createUserMaxOrganizationCountReachedError());
    });
  });

  describe('checkIfOrganizationCanCreateNewDocument', () => {
    test('it is possible to create a new document if the organization has enough allowed storage space defined in the organization plan', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user-1@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        organizationSubscriptions: [{
          id: 'org_sub_1',
          organizationId: 'organization-1',
          planId: PLUS_PLAN_ID,
          stripeSubscriptionId: 'sub_123',
          stripeCustomerId: 'cus_123',
          status: 'active',
          currentPeriodStart: new Date('2025-03-18T00:00:00.000Z'),
          currentPeriodEnd: new Date('2025-04-18T00:00:00.000Z'),
          cancelAtPeriodEnd: false,
        }],
        documents: [{
          id: 'doc_1',
          organizationId: 'organization-1',
          originalSize: 100,
          mimeType: 'text/plain',
          originalName: 'test.txt',
          originalStorageKey: 'test.txt',
          originalSha256Hash: '123',
          name: 'test.txt',
        }],
      });

      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            id: PLUS_PLAN_ID,
            name: 'Plus',
            limits: {
              maxDocumentStorageBytes: 512,
              maxIntakeEmailsCount: 10,
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as PlansRepository;

      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      // no throw as the document size is less than the allowed storage space
      await checkIfOrganizationCanCreateNewDocument({
        organizationId: 'organization-1',
        newDocumentSize: 100,
        documentsRepository,
        plansRepository,
        subscriptionsRepository,
      });

      // throw as the document size is greater than the allowed storage space
      await expect(
        checkIfOrganizationCanCreateNewDocument({
          organizationId: 'organization-1',
          newDocumentSize: 413,
          documentsRepository,
          plansRepository,
          subscriptionsRepository,
        }),
      ).rejects.toThrow(
        createOrganizationDocumentStorageLimitReachedError(),
      );
    });
  });
});
