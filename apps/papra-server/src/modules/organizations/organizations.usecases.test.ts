import type { EmailsServices } from '../emails/emails.services';
import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import { describe, expect, test } from 'vitest';
import { createForbiddenError } from '../app/auth/auth.errors';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { PLUS_PLAN_ID } from '../plans/plans.constants';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createMaxOrganizationMembersCountReachedError, createOrganizationDocumentStorageLimitReachedError, createOrganizationInvitationAlreadyExistsError, createOrganizationNotFoundError, createUserAlreadyInOrganizationError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError, createUserNotOrganizationOwnerError, createUserOrganizationInvitationLimitReachedError } from './organizations.errors';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationInvitationsTable, organizationMembersTable, organizationsTable } from './organizations.table';
import { checkIfOrganizationCanCreateNewDocument, checkIfUserCanCreateNewOrganization, ensureUserIsInOrganization, ensureUserIsOwnerOfOrganization, getOrCreateOrganizationCustomerId, inviteMemberToOrganization, removeMemberFromOrganization } from './organizations.usecases';

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
          seatsCount: 10,
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

  describe('removeMemberFromOrganization', () => {
    test('a admin can remove himself from the organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { id: 'member-1', organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { id: 'member-2', organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.ADMIN },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      await removeMemberFromOrganization({
        memberId: 'member-2',
        userId: 'user-2',
        organizationId: 'organization-1',
        organizationsRepository,
      });

      const remainingMembers = await db.select().from(organizationMembersTable);

      expect(remainingMembers.length).to.equal(1);
      expect(remainingMembers[0]?.id).to.equal('member-1');
    });

    test('a member (not admin nor owner) cannot remove anyone from the organization', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { id: 'member-1', organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.MEMBER },
          { id: 'member-2', organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.MEMBER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await expect(
        removeMemberFromOrganization({
          memberId: 'member-2',
          userId: 'user-2',
          organizationId: 'organization-1',
          organizationsRepository,
          logger,
        }),
      ).rejects.toThrow(createForbiddenError());

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          level: 'error',
          message: 'User does not have permission to remove member from organization',
          namespace: 'test',
          data: {
            memberId: 'member-2',
            userId: 'user-2',
            organizationId: 'organization-1',
            userRole: 'member',
            memberRole: 'member',
          },
        },
      ]);
    });

    test('one cannot remove a user from another organization', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'user-2', email: 'user-2@example.com' },
        ],
        organizations: [
          { id: 'organization-1', name: 'Organization 1' },
          { id: 'organization-2', name: 'Organization 2' },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });

      await expect(
        removeMemberFromOrganization({
          memberId: 'member-2',
          userId: 'user-2',
          organizationId: 'organization-1',
          organizationsRepository,
          logger,
        }),
      ).rejects.toThrow(createForbiddenError());

      expect(getLogs({ excludeTimestampMs: true })).to.eql([
        {
          level: 'error',
          message: 'Member or current user not found in organization',
          namespace: 'test',
          data: {
            memberId: 'member-2',
            userId: 'user-2',
            organizationId: 'organization-1',
          },
        },
      ]);
    });
  });

  describe('inviteMemberToOrganization', () => {
    test('only organization owners and admins can invite members, regular members cannot send invitations', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'owner@example.com' },
          { id: 'user-2', email: 'admin@example.com' },
          { id: 'user-3', email: 'member@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.ADMIN },
          { organizationId: 'organization-1', userId: 'user-3', role: ORGANIZATION_ROLES.MEMBER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const sentEmails: unknown[] = [];
      const emailsServices = {
        sendEmail: async (args: unknown) => sentEmails.push(args),
      } as unknown as EmailsServices;

      // Owner can invite
      const { organizationInvitation: ownerInvitation } = await inviteMemberToOrganization({
        email: 'new-member-1@example.com',
        role: ORGANIZATION_ROLES.MEMBER,
        organizationId: 'organization-1',
        organizationsRepository,
        subscriptionsRepository,
        plansRepository,
        inviterId: 'user-1',
        expirationDelayDays: 7,
        maxInvitationsPerDay: 10,
        emailsServices,
        config,
      });

      expect(ownerInvitation?.email).toBe('new-member-1@example.com');

      // Admin can invite
      const { organizationInvitation: adminInvitation } = await inviteMemberToOrganization({
        email: 'new-member-2@example.com',
        role: ORGANIZATION_ROLES.MEMBER,
        organizationId: 'organization-1',
        organizationsRepository,
        subscriptionsRepository,
        plansRepository,
        inviterId: 'user-2',
        expirationDelayDays: 7,
        maxInvitationsPerDay: 10,
        emailsServices,
        config,
      });

      expect(adminInvitation?.email).toBe('new-member-2@example.com');

      // Member cannot invite
      await expect(
        inviteMemberToOrganization({
          email: 'new-member-3@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-3',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createForbiddenError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'Inviter does not have permission to invite members to organization',
          namespace: 'test',
          data: {
            inviterId: 'user-3',
            organizationId: 'organization-1',
          },
        },
      ]);
    });

    test('it is not possible to create an invitation for the owner role to prevent multiple owners in an organization', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'owner@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'new-owner@example.com',
          role: ORGANIZATION_ROLES.OWNER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-1',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createForbiddenError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'Cannot create another owner in organization',
          namespace: 'test',
          data: {
            inviterId: 'user-1',
            organizationId: 'organization-1',
          },
        },
      ]);
    });

    test('cannot invite a user who is already a member of the organization to prevent duplicate memberships', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'owner@example.com' },
          { id: 'user-2', email: 'existing-member@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
          { id: 'member-2', organizationId: 'organization-1', userId: 'user-2', role: ORGANIZATION_ROLES.MEMBER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'existing-member@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-1',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createUserAlreadyInOrganizationError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'User already in organization',
          namespace: 'test',
          data: {
            inviterId: 'user-1',
            organizationId: 'organization-1',
            email: 'existing-member@example.com',
            memberId: 'member-2',
            memberUserId: 'user-2',
          },
        },
      ]);
    });

    test('cannot create multiple invitations for the same email address to the same organization to prevent spam and confusion', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'owner@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        organizationInvitations: [
          {
            id: 'invitation-1',
            organizationId: 'organization-1',
            email: 'invited@example.com',
            role: ORGANIZATION_ROLES.MEMBER,
            inviterId: 'user-1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'invited@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-1',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createOrganizationInvitationAlreadyExistsError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'Invitation already exists',
          namespace: 'test',
          data: {
            inviterId: 'user-1',
            organizationId: 'organization-1',
            email: 'invited@example.com',
            invitationId: 'invitation-1',
          },
        },
      ]);
    });

    test('cannot invite new members when the organization has reached its maximum member count (including pending invitations) defined by the plan to enforce subscription limits', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'owner@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        organizationInvitations: [
          {
            organizationId: 'organization-1',
            email: 'pending-1@example.com',
            role: ORGANIZATION_ROLES.MEMBER,
            inviterId: 'user-1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 2,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'new-member@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-1',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createMaxOrganizationMembersCountReachedError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'Organization has reached its maximum number of members',
          namespace: 'test',
          data: {
            inviterId: 'user-1',
            organizationId: 'organization-1',
            membersCount: 1,
            maxMembers: 2,
          },
        },
      ]);
    });

    test('users have a daily invitation limit to prevent spam and abuse of the invitation system', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'owner@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
        organizationInvitations: [
          {
            organizationId: 'organization-1',
            email: 'invited-1@example.com',
            role: ORGANIZATION_ROLES.MEMBER,
            inviterId: 'user-1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
            createdAt: new Date('2025-10-05T10:00:00Z'),
          },
          {
            organizationId: 'organization-1',
            email: 'invited-2@example.com',
            role: ORGANIZATION_ROLES.MEMBER,
            inviterId: 'user-1',
            status: 'pending',
            expiresAt: new Date('2025-12-31'),
            createdAt: new Date('2025-10-05T14:00:00Z'),
          },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 2 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'new-member@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-1',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 2,
          now: new Date('2025-10-05T18:00:00Z'),
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createUserOrganizationInvitationLimitReachedError());
    });

    test('invitations are created with the correct expiration date and an email notification is sent to the invited user', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'owner@example.com' }],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({
        organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 },
        client: { baseUrl: 'https://app.example.com' },
      });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const sentEmails: unknown[] = [];
      const emailsServices = {
        sendEmail: async (args: unknown) => sentEmails.push(args),
      } as unknown as EmailsServices;

      const now = new Date('2025-10-05T12:00:00Z');
      const { organizationInvitation } = await inviteMemberToOrganization({
        email: 'new-member@example.com',
        role: ORGANIZATION_ROLES.ADMIN,
        organizationId: 'organization-1',
        organizationsRepository,
        subscriptionsRepository,
        plansRepository,
        inviterId: 'user-1',
        expirationDelayDays: 7,
        maxInvitationsPerDay: 10,
        now,
        emailsServices,
        config,
      });

      expect(organizationInvitation).toMatchObject({
        email: 'new-member@example.com',
        role: ORGANIZATION_ROLES.ADMIN,
        organizationId: 'organization-1',
        inviterId: 'user-1',
        status: 'pending',
        expiresAt: new Date('2025-10-12T12:00:00Z'),
      });

      // Verify email was sent
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toMatchObject({
        to: 'new-member@example.com',
        subject: 'You are invited to join an organization',
      });

      // Verify invitation was saved in database
      const invitations = await db.select().from(organizationInvitationsTable);
      expect(invitations).toHaveLength(1);
      expect(invitations[0]).toMatchObject({
        email: 'new-member@example.com',
        role: ORGANIZATION_ROLES.ADMIN,
        organizationId: 'organization-1',
        inviterId: 'user-1',
        status: 'pending',
      });
    });

    test('users who are not members of the organization cannot send invitations to prevent unauthorized access', async () => {
      const { logger, getLogs } = createTestLogger();
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'user-1', email: 'owner@example.com' },
          { id: 'user-2', email: 'outsider@example.com' },
        ],
        organizations: [{ id: 'organization-1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'organization-1', userId: 'user-1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const organizationsRepository = createOrganizationsRepository({ db });
      const subscriptionsRepository = createSubscriptionsRepository({ db });
      const config = overrideConfig({ organizations: { invitationExpirationDelayDays: 7, maxUserInvitationsPerDay: 10 } });
      const plansRepository = {
        getOrganizationPlanById: async () => ({
          organizationPlan: {
            limits: {
              maxOrganizationsMembersCount: 100,
            },
          },
        }),
      } as unknown as PlansRepository;

      const emailsServices = {
        sendEmail: async () => {},
      } as unknown as EmailsServices;

      await expect(
        inviteMemberToOrganization({
          email: 'new-member@example.com',
          role: ORGANIZATION_ROLES.MEMBER,
          organizationId: 'organization-1',
          organizationsRepository,
          subscriptionsRepository,
          plansRepository,
          inviterId: 'user-2',
          expirationDelayDays: 7,
          maxInvitationsPerDay: 10,
          logger,
          emailsServices,
          config,
        }),
      ).rejects.toThrow(createUserNotInOrganizationError());

      expect(getLogs({ excludeTimestampMs: true })).toEqual([
        {
          level: 'error',
          message: 'Inviter not found in organization',
          namespace: 'test',
          data: {
            inviterId: 'user-2',
            organizationId: 'organization-1',
          },
        },
      ]);
    });
  });
});
