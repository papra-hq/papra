import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { PLUS_PLAN_ID } from '../plans/plans.constants';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationDocumentStorageLimitReachedError, createOrganizationNotFoundError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError, createUserNotOrganizationOwnerError } from './organizations.errors';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationMembersTable, organizationsTable } from './organizations.table';
import { checkIfOrganizationCanCreateNewDocument, checkIfUserCanCreateNewOrganization, ensureUserIsInOrganization, ensureUserIsOwnerOfOrganization, getOrCreateOrganizationCustomerId } from './organizations.usecases';

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
      const config = await overrideConfig({ organizations: { maxOrganizationCount: 2 } });

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
      const config = await overrideConfig({ organizations: { maxOrganizationCount: 2 } });

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
          seatsCount: 1,
          customerId: 'cus_123',
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
      } as unknown as PlansRepository;

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

  describe('getOrCreateOrganizationCustomerId', () => {
    describe(`in order to handle organization subscriptions, we need a stripe customer id per organization
              as stripe require an email per customer, we use the organization owner's email`, () => {
      test('an organization that does not have a customer id, will have one created and saved', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const createCustomerArgs: unknown[] = [];

        const subscriptionsServices = {
          createCustomer: async (args: unknown) => {
            createCustomerArgs.push(args);
            return { customerId: 'cus_123' };
          },
        } as unknown as SubscriptionsServices;

        const { customerId } = await getOrCreateOrganizationCustomerId({
          organizationId: 'organization-1',
          subscriptionsServices,
          organizationsRepository,
        });

        expect(createCustomerArgs).toEqual([{ email: 'user-1@example.com', ownerId: 'user-1', organizationId: 'organization-1' }]);
        expect(customerId).toEqual('cus_123');

        const { organization } = await organizationsRepository.getOrganizationById({ organizationId: 'organization-1' });

        expect(organization?.customerId).toEqual('cus_123');
      });

      test('an organization that already has a customer id, will not have a new customer created', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'user-1', email: 'user-1@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Organization 1', customerId: 'cus_123' }],
          organizationMembers: [{ organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsServices = {
          createCustomer: async () => expect.fail('createCustomer should not be called'),
        } as unknown as SubscriptionsServices;

        const { customerId } = await getOrCreateOrganizationCustomerId({
          organizationId: 'organization-1',
          subscriptionsServices,
          organizationsRepository,
        });

        expect(customerId).toEqual('cus_123');

        // ensure the customer id is still the same in the database
        const { organization } = await organizationsRepository.getOrganizationById({ organizationId: 'organization-1' });

        expect(organization?.customerId).toEqual('cus_123');
      });

      test('if the organization does not exist, an error is thrown', async () => {
        const { db } = await createInMemoryDatabase();
        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsServices = {
          createCustomer: async () => expect.fail('createCustomer should not be called'),
        } as unknown as SubscriptionsServices;

        await expect(
          getOrCreateOrganizationCustomerId({
            organizationId: 'organization-1',
            subscriptionsServices,
            organizationsRepository,
          }),
        ).rejects.toThrow(
          createOrganizationNotFoundError(),
        );
      });
    });
  });

  describe('ensureUserIsOwnerOfOrganization', () => {
    test('throws an error if the user is not the owner of the organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
          { id: 'user-3', email: 'user-3@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.MEMBER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      // no throw as user-1 is the owner of the organization
      await ensureUserIsOwnerOfOrganization({
        userId: 'user-1',
        organizationId: 'organization-1',
        organizationsRepository,
      });

      // throw as user-2 is not the owner of the organization
      await expect(
        ensureUserIsOwnerOfOrganization({
          userId: 'user-2',
          organizationId: 'organization-1',
          organizationsRepository,
        }),
      ).rejects.toThrow(
        createUserNotOrganizationOwnerError(),
      );

      // throw as user-3 is not in the organization
      await expect(
        ensureUserIsOwnerOfOrganization({
          userId: 'user-3',
          organizationId: 'organization-1',
          organizationsRepository,
        }),
      ).rejects.toThrow(
        createUserNotOrganizationOwnerError(),
      );
    });
  });
});
