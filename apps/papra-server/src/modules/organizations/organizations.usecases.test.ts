import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { EmailsServices } from '../emails/emails.services';
import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import { assert, describe, expect, test } from 'vitest';
import { createForbiddenError } from '../app/auth/auth.errors';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createTestLogger } from '../shared/logger/logger.test-utils';
import { createSubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import { createUsersRepository } from '../users/users.repository';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createMaxOrganizationMembersCountReachedError, createOrganizationHasActiveSubscriptionError, createOrganizationInvitationAlreadyExistsError, createOrganizationNotFoundError, createUserAlreadyInOrganizationError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError, createUserNotOrganizationOwnerError, createUserOrganizationInvitationLimitReachedError } from './organizations.errors';
import { createOrganizationsRepository } from './organizations.repository';
import { organizationInvitationsTable, organizationMembersTable, organizationsTable } from './organizations.table';
import { checkIfUserCanCreateNewOrganization, ensureUserIsInOrganization, ensureUserIsOwnerOfOrganization, getOrCreateOrganizationCustomerId, inviteMemberToOrganization, purgeExpiredSoftDeletedOrganization, purgeExpiredSoftDeletedOrganizations, removeMemberFromOrganization, softDeleteOrganization } from './organizations.usecases';

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

  describe('softDeleteOrganization', () => {
    describe('when an organization owner wants to delete their organization, the organization is soft-deleted to allow for recovery within a grace period', () => {
      test('owner can soft-delete organization with all metadata set correctly', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Test Org' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await softDeleteOrganization({
          organizationId: 'organization-1',
          deletedBy: 'usr_1',
          organizationsRepository,
          subscriptionsRepository,
          config,
          now: new Date('2025-10-05'),
        });

        const [organization] = await db.select().from(organizationsTable);
        expect(organization?.deletedAt).to.eql(new Date('2025-10-05'));
        expect(organization?.deletedBy).to.eql('usr_1');
        expect(organization?.scheduledPurgeAt).to.eql(new Date('2025-11-04'));
      });

      test('only owner can delete organization, admins and members cannot', async () => {
        const { db } = await createInMemoryDatabase({
          users: [
            { id: 'usr_1', email: 'owner@example.com' },
            { id: 'admin-user', email: 'admin@example.com' },
          ],
          organizations: [{ id: 'organization-1', name: 'Test Org' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
            { organizationId: 'organization-1', userId: 'admin-user', role: ORGANIZATION_ROLES.ADMIN },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await expect(
          softDeleteOrganization({
            organizationId: 'organization-1',
            deletedBy: 'admin-user',
            organizationsRepository,
            subscriptionsRepository,
            config,
          }),
        ).rejects.toThrow(createUserNotOrganizationOwnerError());
      });

      test('soft deletion removes all members and invitations from the organization', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Test Org' }],
          organizationMembers: [
            { id: 'member-1', organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
          organizationInvitations: [
            {
              organizationId: 'organization-1',
              email: 'invited@example.com',
              role: ORGANIZATION_ROLES.MEMBER,
              inviterId: 'usr_1',
              status: 'pending',
              expiresAt: new Date('2025-12-31'),
            },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await softDeleteOrganization({
          organizationId: 'organization-1',
          deletedBy: 'usr_1',
          organizationsRepository,
          subscriptionsRepository,
          config,
        });

        const remainingMembers = await db.select().from(organizationMembersTable);
        const remainingInvitations = await db.select().from(organizationInvitationsTable);

        expect(remainingMembers).toHaveLength(0);
        expect(remainingInvitations).toHaveLength(0);
      });

      test('attempting to delete a non-existent organization throws an error', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await expect(
          softDeleteOrganization({
            organizationId: 'non-existent-org',
            deletedBy: 'usr_1',
            organizationsRepository,
            subscriptionsRepository,
            config,
          }),
        ).rejects.toThrow(createOrganizationNotFoundError());
      });

      test('soft deletion only affects the target organization, not other organizations', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [
            { id: 'organization-1', name: 'Org to Delete' },
            { id: 'organization-2', name: 'Other Org' },
          ],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
            { organizationId: 'organization-2', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await softDeleteOrganization({
          organizationId: 'organization-1',
          deletedBy: 'usr_1',
          organizationsRepository,
          subscriptionsRepository,
          config,
          now: new Date('2025-10-05'),
        });

        const members = await db.select().from(organizationMembersTable);
        const [org1, org2] = await db.select().from(organizationsTable).orderBy(organizationsTable.id);

        // Only organization-2 member remains
        expect(members).toHaveLength(1);
        expect(members[0]?.organizationId).toBe('organization-2');

        expect(org1?.deletedAt).to.eql(new Date('2025-10-05'));
        expect(org2?.deletedAt).to.eql(null);
      });

      test('cannot delete organization with an active subscription', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Test Org', customerId: 'cus_123' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
          organizationSubscriptions: [
            {
              id: 'sub_123',
              organizationId: 'organization-1',
              customerId: 'cus_123',
              planId: 'plan_pro',
              status: 'active',
              seatsCount: 5,
              currentPeriodStart: new Date('2025-10-01'),
              currentPeriodEnd: new Date('2025-11-01'),
              cancelAtPeriodEnd: false,
            },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await expect(
          softDeleteOrganization({
            organizationId: 'organization-1',
            deletedBy: 'usr_1',
            organizationsRepository,
            subscriptionsRepository,
            config,
          }),
        ).rejects.toThrow(createOrganizationHasActiveSubscriptionError());

        // Organization should not be deleted
        const [organization] = await db.select().from(organizationsTable);
        expect(organization?.deletedAt).to.eql(null);
      });

      test('can delete organization with subscription scheduled to cancel at period end', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Test Org', customerId: 'cus_123' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
          organizationSubscriptions: [
            {
              id: 'sub_123',
              organizationId: 'organization-1',
              customerId: 'cus_123',
              planId: 'plan_pro',
              status: 'active',
              seatsCount: 5,
              currentPeriodStart: new Date('2025-10-01'),
              currentPeriodEnd: new Date('2025-11-01'),
              cancelAtPeriodEnd: true, // User already canceled, allow org deletion
            },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await softDeleteOrganization({
          organizationId: 'organization-1',
          deletedBy: 'usr_1',
          organizationsRepository,
          subscriptionsRepository,
          config,
          now: new Date('2025-10-05'),
        });

        // Organization should be deleted
        const [organization] = await db.select().from(organizationsTable);
        expect(organization?.deletedAt).to.eql(new Date('2025-10-05'));
        expect(organization?.deletedBy).to.eql('usr_1');
      });

      test('can delete organization after subscription is canceled', async () => {
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{ id: 'organization-1', name: 'Test Org', customerId: 'cus_123' }],
          organizationMembers: [
            { organizationId: 'organization-1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
          ],
          organizationSubscriptions: [
            {
              id: 'sub_123',
              organizationId: 'organization-1',
              customerId: 'cus_123',
              planId: 'plan_pro',
              status: 'canceled',
              seatsCount: 5,
              currentPeriodStart: new Date('2025-10-01'),
              currentPeriodEnd: new Date('2025-11-01'),
              cancelAtPeriodEnd: false,
            },
          ],
        });

        const organizationsRepository = createOrganizationsRepository({ db });
        const subscriptionsRepository = createSubscriptionsRepository({ db });
        const config = overrideConfig();

        await softDeleteOrganization({
          organizationId: 'organization-1',
          deletedBy: 'usr_1',
          organizationsRepository,
          subscriptionsRepository,
          config,
          now: new Date('2025-10-05'),
        });

        const [organization] = await db.select().from(organizationsTable);
        expect(organization?.deletedAt).to.eql(new Date('2025-10-05'));
        expect(organization?.deletedBy).to.eql('usr_1');
      });
    });
  });

  describe('purgeExpiredSoftDeletedOrganization', () => {
    describe('when a deleted organization reaches its scheduled purge date, it should be permanently deleted along with all its documents from storage', () => {
      test('successfully purges organization and deletes all documents from storage', async () => {
        const { logger, getLogs } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{
            id: 'organization-1',
            name: 'Expired Org',
            deletedAt: new Date('2025-10-05'),
            deletedBy: 'usr_1',
            scheduledPurgeAt: new Date('2025-11-04'),
          }],
          documents: [
            {
              id: 'doc-1',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/doc-1.pdf',
              originalName: 'doc-1.pdf',
              name: 'doc-1.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash1',
            },
            {
              id: 'doc-2',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/doc-2.txt',
              originalName: 'doc-2.txt',
              name: 'doc-2.txt',
              mimeType: 'text/plain',
              originalSize: 512,
              originalSha256Hash: 'hash2',
              isDeleted: true,
              deletedAt: new Date('2025-10-10'),
              deletedBy: 'usr_1',
            },
          ],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        await purgeExpiredSoftDeletedOrganization({
          organizationId: 'organization-1',
          documentsRepository,
          organizationsRepository,
          documentsStorageService,
          logger,
        });

        // Verify files were deleted from storage (order may vary due to async processing)
        expect(deletedFiles.toSorted()).to.eql(['org-1/doc-1.pdf', 'org-1/doc-2.txt'].toSorted());

        // Verify organization was deleted from database
        const orgs = await db.select().from(organizationsTable);
        expect(orgs).to.eql([]);

        // Ensure logs contain expected entries (order may vary)
        assert.includeDeepMembers(
          getLogs({ excludeTimestampMs: true }),
          [
            {
              level: 'info',
              message: 'Starting purge of organization',
              namespace: 'test',
              data: {
                organizationId: 'organization-1',
              },
            },
            {
              level: 'debug',
              message: 'Deleted document file from storage',
              namespace: 'test',
              data: {
                documentId: 'doc-2',
                organizationId: 'organization-1',
                storageKey: 'org-1/doc-2.txt',
              },
            },
            {
              level: 'debug',
              message: 'Deleted document file from storage',
              namespace: 'test',
              data: {
                documentId: 'doc-1',
                organizationId: 'organization-1',
                storageKey: 'org-1/doc-1.pdf',
              },
            },
            {
              level: 'info',
              message: 'Finished deleting document files from storage',
              namespace: 'test',
              data: {
                deletedCount: 2,
                failedCount: 0,
                organizationId: 'organization-1',
              },
            },
            {
              level: 'info',
              message: 'Successfully purged organization',
              namespace: 'test',
              data: {
                organizationId: 'organization-1',
              },
            },
          ],
        );
      });

      test('handles storage deletion errors gracefully and continues purging', async () => {
        const { logger, getLogs } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{
            id: 'organization-1',
            name: 'Expired Org',
            deletedAt: new Date('2025-10-05'),
            deletedBy: 'usr_1',
            scheduledPurgeAt: new Date('2025-11-04'),
          }],
          documents: [
            {
              id: 'doc-1',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/missing-file.pdf',
              originalName: 'missing-file.pdf',
              name: 'missing-file.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash1',
            },
            {
              id: 'doc-2',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/doc-2.txt',
              originalName: 'doc-2.txt',
              name: 'doc-2.txt',
              mimeType: 'text/plain',
              originalSize: 512,
              originalSha256Hash: 'hash2',
            },
          ],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            if (storageKey === 'org-1/missing-file.pdf') {
              throw new Error('File not found in storage');
            }
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        await purgeExpiredSoftDeletedOrganization({
          organizationId: 'organization-1',
          documentsRepository,
          organizationsRepository,
          documentsStorageService,
          logger,
        });

        // Verify only the successful file was deleted
        expect(deletedFiles).to.eql(['org-1/doc-2.txt']);

        // Verify organization was still deleted despite storage errors
        const orgs = await db.select().from(organizationsTable);
        expect(orgs).to.eql([]);

        // Verify error was logged
        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs).toContainEqual(expect.objectContaining({
          level: 'error',
          message: 'Failed to delete document file from storage',
        }));
        expect(logs).toContainEqual(expect.objectContaining({
          level: 'info',
          message: 'Finished deleting document files from storage',
          data: { organizationId: 'organization-1', deletedCount: 1, failedCount: 1 },
        }));
      });

      test('purges organization even when it has no documents', async () => {
        const { logger } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{
            id: 'organization-1',
            name: 'Empty Org',
            deletedAt: new Date('2025-10-05'),
            deletedBy: 'usr_1',
            scheduledPurgeAt: new Date('2025-11-04'),
          }],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        await purgeExpiredSoftDeletedOrganization({
          organizationId: 'organization-1',
          documentsRepository,
          organizationsRepository,
          documentsStorageService,
          logger,
        });

        // No files should have been deleted
        expect(deletedFiles).to.eql([]);

        // Organization should still be deleted
        const orgs = await db.select().from(organizationsTable);
        expect(orgs).to.eql([]);
      });

      test('processes documents in batches for large organizations', async () => {
        const { logger } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [{
            id: 'organization-1',
            name: 'Large Org',
            deletedAt: new Date('2025-10-05'),
            deletedBy: 'usr_1',
            scheduledPurgeAt: new Date('2025-11-04'),
          }],
          documents: Array.from({ length: 250 }, (_, i) => ({
            id: `doc-${i}`,
            organizationId: 'organization-1',
            originalStorageKey: `org-1/doc-${i}.pdf`,
            originalName: `doc-${i}.pdf`,
            name: `doc-${i}.pdf`,
            mimeType: 'application/pdf',
            originalSize: 1024,
            originalSha256Hash: `hash${i}`,
          })),
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        await purgeExpiredSoftDeletedOrganization({
          organizationId: 'organization-1',
          documentsRepository,
          organizationsRepository,
          documentsStorageService,
          logger,
          batchSize: 100,
        });

        // All 250 files should have been deleted
        expect(deletedFiles.length).to.eql(250);

        // Organization should be deleted
        const orgs = await db.select().from(organizationsTable);
        expect(orgs).to.eql([]);
      });
    });
  });

  describe('purgeExpiredSoftDeletedOrganizations', () => {
    describe('batch purges all expired organizations past their scheduled purge date', () => {
      test('purges multiple expired organizations', async () => {
        const { logger, getLogs } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [
            {
              id: 'organization-1',
              name: 'Expired Org 1',
              deletedAt: new Date('2025-10-01'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-10-31'),
            },
            {
              id: 'organization-2',
              name: 'Expired Org 2',
              deletedAt: new Date('2025-09-15'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-10-15'),
            },
            {
              id: 'organization-3',
              name: 'Not Yet Expired',
              deletedAt: new Date('2025-11-01'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-12-01'),
            },
          ],
          documents: [
            {
              id: 'doc-1',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/doc-1.pdf',
              originalName: 'doc-1.pdf',
              name: 'doc-1.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash1',
            },
            {
              id: 'doc-2',
              organizationId: 'organization-2',
              originalStorageKey: 'org-2/doc-2.pdf',
              originalName: 'doc-2.pdf',
              name: 'doc-2.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash2',
            },
            {
              id: 'doc-3',
              organizationId: 'organization-3',
              originalStorageKey: 'org-3/doc-3.pdf',
              originalName: 'doc-3.pdf',
              name: 'doc-3.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash3',
            },
          ],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        const { purgedOrganizationCount } = await purgeExpiredSoftDeletedOrganizations({
          organizationsRepository,
          documentsRepository,
          documentsStorageService,
          logger,
          now: new Date('2025-11-05'),
        });

        // Only expired organizations should be purged
        expect(purgedOrganizationCount).to.eql(2);

        // Only files from expired organizations should be deleted
        expect(deletedFiles.toSorted()).to.eql(['org-1/doc-1.pdf', 'org-2/doc-2.pdf'].toSorted());

        // Only the not-yet-expired organization should remain
        const orgs = await db.select().from(organizationsTable);
        expect(orgs.length).to.eql(1);
        expect(orgs[0]?.id).to.eql('organization-3');

        // Verify logs
        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs).toContainEqual(expect.objectContaining({
          level: 'info',
          message: 'Found expired soft-deleted organizations to purge',
          data: { organizationCount: 2 },
        }));
      });

      test('handles errors during individual organization purge and continues with others', async () => {
        const { logger, getLogs } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [
            {
              id: 'organization-1',
              name: 'Will Fail',
              deletedAt: new Date('2025-10-01'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-10-31'),
            },
            {
              id: 'organization-2',
              name: 'Will Succeed',
              deletedAt: new Date('2025-10-01'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-10-31'),
            },
          ],
          documents: [
            {
              id: 'doc-1',
              organizationId: 'organization-1',
              originalStorageKey: 'org-1/doc-1.pdf',
              originalName: 'doc-1.pdf',
              name: 'doc-1.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash1',
            },
            {
              id: 'doc-2',
              organizationId: 'organization-2',
              originalStorageKey: 'org-2/doc-2.pdf',
              originalName: 'doc-2.pdf',
              name: 'doc-2.pdf',
              mimeType: 'application/pdf',
              originalSize: 1024,
              originalSha256Hash: 'hash2',
            },
          ],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            if (storageKey.startsWith('org-1/')) {
              throw new Error('Storage service error');
            }
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        const { purgedOrganizationCount } = await purgeExpiredSoftDeletedOrganizations({
          organizationsRepository,
          documentsRepository,
          documentsStorageService,
          logger,
          now: new Date('2025-11-05'),
        });

        // Both organizations should be purged even though org-1 had storage deletion errors
        // The singular purge function catches file deletion errors but continues
        // and still deletes the organization record from the database
        expect(purgedOrganizationCount).to.eql(2);

        // Only successful file should be deleted
        expect(deletedFiles).to.eql(['org-2/doc-2.pdf']);

        // Both organizations should be deleted from database despite storage errors
        const orgs = await db.select().from(organizationsTable);
        expect(orgs).to.eql([]);

        // Verify file deletion error was logged (but not organization purge failure)
        const logs = getLogs({ excludeTimestampMs: true });
        expect(logs).toContainEqual(expect.objectContaining({
          level: 'error',
          message: 'Failed to delete document file from storage',
        }));
      });

      test('returns zero count when no organizations need purging', async () => {
        const { logger } = createTestLogger();
        const { db } = await createInMemoryDatabase({
          users: [{ id: 'usr_1', email: 'owner@example.com' }],
          organizations: [
            {
              id: 'organization-1',
              name: 'Not Yet Expired',
              deletedAt: new Date('2025-11-01'),
              deletedBy: 'usr_1',
              scheduledPurgeAt: new Date('2025-12-01'),
            },
          ],
        });

        const documentsRepository = createDocumentsRepository({ db });
        const organizationsRepository = createOrganizationsRepository({ db });

        const deletedFiles: string[] = [];
        const documentsStorageService = {
          deleteFile: async ({ storageKey }: { storageKey: string }) => {
            deletedFiles.push(storageKey);
          },
        } as DocumentStorageService;

        const { purgedOrganizationCount } = await purgeExpiredSoftDeletedOrganizations({
          organizationsRepository,
          documentsRepository,
          documentsStorageService,
          logger,
          now: new Date('2025-11-05'),
        });

        expect(purgedOrganizationCount).to.eql(0);
        expect(deletedFiles).to.eql([]);

        // Organization should remain
        const orgs = await db.select().from(organizationsTable);
        expect(orgs.length).to.eql(1);
      });
    });
  });
});
