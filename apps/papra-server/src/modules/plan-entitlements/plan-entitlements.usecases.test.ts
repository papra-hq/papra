import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { ORGANIZATION_ROLES } from '../organizations/organizations.constants';
import { createTestClock } from '../shared/clock/clock.test-utils';
import { createUsersRepository } from '../users/users.repository';
import { createPlanEntitlementsRepository } from './plan-entitlements.repository';
import {
  createEmptyTestPlanEntitlementRegistry,
  createTestPlanEntitlementDriver,
  createTestPlanEntitlementRegistry,
} from './plan-entitlements.test-utils';
import {
  claimUserPlanEntitlement,
  grantUserPlanEntitlement,
  resolveOrganizationEntitlementCouponId,
  reverifyUserClaimedPlanEntitlements,
} from './plan-entitlements.usecases';

describe('plan-entitlements usecases', () => {
  describe('grantUserPlanEntitlement', () => {
    test('when the user is eligible, the entitlement is created and marked as verified', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => true }),
      });

      const { planEntitlement } = await grantUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        source: 'admin',
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      expect(planEntitlement?.lastVerifiedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
      expect(planEntitlement?.grantedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
      expect(planEntitlement?.source).to.eql('admin');
    });

    test('when the user is not eligible, a not-eligible error is raised and no entitlement is created', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => false }),
      });

      await expect(
        grantUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          source: 'admin',
          usersRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('User is not eligible for this entitlement');

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });
      expect(planEntitlements).to.eql([]);
    });

    test('the eligibility is verified with the target user id and email', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const verifiedUsers: { id: string; email: string }[] = [];
      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async ({ user }) => {
            verifiedUsers.push({ id: user.id, email: user.email });
            return true;
          },
        }),
      });

      await grantUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        source: 'admin',
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(verifiedUsers).to.eql([{ id: 'usr_1', email: 'user-1@example.com' }]);
    });

    test('when no driver exists for the entitlement type, an unknown-type error is raised', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createEmptyTestPlanEntitlementRegistry();

      await expect(
        grantUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          source: 'admin',
          usersRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('Unknown plan entitlement type');
    });
  });

  describe('claimUserPlanEntitlement', () => {
    test('when the user is eligible, the entitlement is created with the user-claim source and expires at the end of the driver validity window', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          claimValidityDuration: { hours: 10 * 24 },
        }),
      });

      const { planEntitlement } = await claimUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      expect(planEntitlement?.source).to.eql('user-claim');
      expect(planEntitlement?.expiresAt).to.eql(new Date('2026-06-11T12:00:00Z'));
      expect(planEntitlement?.lastVerifiedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
    });

    test('when new claims are disabled for the driver, a claims-not-enabled error is raised and no entitlement is created', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          getIsEnabledForNewClaims: async () => false,
        }),
      });

      await expect(
        claimUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          usersRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('Claims for this entitlement are not enabled');

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });
      expect(planEntitlements).to.eql([]);
    });

    test('when the user is not eligible, a not-eligible error is raised', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => false }),
      });

      await expect(
        claimUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          usersRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('User is not eligible for this entitlement');
    });

    test('when the user already has an active entitlement of the same type, an already-exists error is raised without verifying the eligibility', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      let verificationCount = 0;
      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => {
            verificationCount += 1;
            return true;
          },
        }),
      });

      await expect(
        claimUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          usersRepository,
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('User already has an entitlement of this type');

      expect(verificationCount).to.eql(0);
    });

    test('when the user has an expired entitlement of the same type, it is re-activated in place instead of raising an already-exists error', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01T00:00:00Z'),
            expiresAt: new Date('2026-02-01T00:00:00Z'),
            lastVerifiedAt: new Date('2026-01-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          claimValidityDuration: { hours: 10 * 24 },
        }),
      });

      const { planEntitlement } = await claimUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      expect(planEntitlement?.id).to.eql('pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa');
      expect(planEntitlement?.source).to.eql('user-claim');
      expect(planEntitlement?.grantedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
      expect(planEntitlement?.expiresAt).to.eql(new Date('2026-06-11T12:00:00Z'));
      expect(planEntitlement?.lastVerifiedAt).to.eql(new Date('2026-06-01T12:00:00Z'));

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });
      expect(planEntitlements).to.have.length(1);
    });
  });

  describe('reverifyUserClaimedPlanEntitlements', () => {
    test('active user-claimed entitlements of still-eligible users get their expiration rolled forward and verification date updated', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-10T00:00:00Z'),
            lastVerifiedAt: new Date('2026-05-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => true,
          claimValidityDuration: { hours: 10 * 24 },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });

      expect(planEntitlements[0]?.expiresAt).to.eql(new Date('2026-06-11T12:00:00Z'));
      expect(planEntitlements[0]?.lastVerifiedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
    });

    test('entitlements of no-longer-eligible users get their expiration capped to the grace period', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-07-10T00:00:00Z'),
            lastVerifiedAt: new Date('2026-05-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => false,
          ineligibilityGraceDuration: { hours: 7 * 24 },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });

      expect(planEntitlements[0]?.expiresAt).to.eql(new Date('2026-06-08T12:00:00Z'));
      expect(planEntitlements[0]?.lastVerifiedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
    });

    test('the ineligibility grace period never extends an entitlement that already expires sooner', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-03T00:00:00Z'),
            lastVerifiedAt: new Date('2026-05-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => false,
          ineligibilityGraceDuration: { hours: 7 * 24 },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });

      expect(planEntitlements[0]?.expiresAt).to.eql(new Date('2026-06-03T00:00:00Z'));
      expect(planEntitlements[0]?.lastVerifiedAt).to.eql(new Date('2026-05-01T00:00:00Z'));
    });

    test('when the eligibility verification fails, the entitlement is left untouched to be retried on the next run', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-10T00:00:00Z'),
            lastVerifiedAt: new Date('2026-05-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => {
            throw new Error('Verification endpoint unavailable');
          },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });

      expect(planEntitlements[0]?.expiresAt).to.eql(new Date('2026-06-10T00:00:00Z'));
      expect(planEntitlements[0]?.lastVerifiedAt).to.eql(new Date('2026-05-01T00:00:00Z'));
    });

    test('admin-granted and already-expired entitlements are not re-verified', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'user-1@example.com' },
          { id: 'usr_2', email: 'user-2@example.com' },
        ],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-10T00:00:00Z'),
          },
          {
            id: 'pla_ent_bbbbbbbbbbbbbbbbbbbbbbbb',
            userId: 'usr_2',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-04-01T00:00:00Z'),
            expiresAt: new Date('2026-05-01T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const verifiedUserIds: string[] = [];
      const usersRepository = createUsersRepository({ db });
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async ({ user }) => {
            verifiedUserIds.push(user.id);
            return true;
          },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      expect(verifiedUserIds).to.eql([]);
    });

    test('a failure while re-verifying one entitlement does not prevent the re-verification of the others', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_1', email: 'user-1@example.com' },
          { id: 'usr_2', email: 'user-2@example.com' },
        ],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-10T00:00:00Z'),
          },
          {
            id: 'pla_ent_bbbbbbbbbbbbbbbbbbbbbbbb',
            userId: 'usr_2',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-05-01T00:00:00Z'),
            expiresAt: new Date('2026-06-10T00:00:00Z'),
          },
        ],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const baseUsersRepository = createUsersRepository({ db });
      const usersRepository = {
        ...baseUsersRepository,
        getUserByIdOrThrow: async (args: { userId: string }) => {
          if (args.userId === 'usr_1') {
            throw new Error('Transient database error');
          }
          return baseUsersRepository.getUserByIdOrThrow(args);
        },
      };
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async () => true,
          claimValidityDuration: { hours: 10 * 24 },
        }),
      });

      await reverifyUserClaimedPlanEntitlements({
        usersRepository,
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
        clock,
      });

      const { planEntitlements: user1Entitlements } =
        await planEntitlementsRepository.getUserPlanEntitlements({ userId: 'usr_1' });
      const { planEntitlements: user2Entitlements } =
        await planEntitlementsRepository.getUserPlanEntitlements({ userId: 'usr_2' });

      expect(user1Entitlements[0]?.expiresAt).to.eql(new Date('2026-06-10T00:00:00Z'));
      expect(user2Entitlements[0]?.expiresAt).to.eql(new Date('2026-06-11T12:00:00Z'));
    });
  });

  describe('resolveOrganizationEntitlementCouponId', () => {
    test('when the organization owner has an active entitlement whose driver defines a subscription discount coupon, the coupon id is resolved', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'org_1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
        ],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ subscriptionDiscountCouponId: 'coupon-1' }),
      });

      const { couponId } = await resolveOrganizationEntitlementCouponId({
        organizationId: 'org_1',
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(couponId).to.eql('coupon-1');
    });

    test('when the entitlement driver does not define a subscription discount coupon, no coupon id is resolved', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'org_1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
        ],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ subscriptionDiscountCouponId: undefined }),
      });

      const { couponId } = await resolveOrganizationEntitlementCouponId({
        organizationId: 'org_1',
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(couponId).to.eql(undefined);
    });

    test('when the organization has no active entitlement, no coupon id is resolved', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'org_1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ subscriptionDiscountCouponId: 'coupon-1' }),
      });

      const { couponId } = await resolveOrganizationEntitlementCouponId({
        organizationId: 'org_1',
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(couponId).to.eql(undefined);
    });

    test('when no driver exists for the entitlement type, no coupon id is resolved', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        organizationMembers: [
          { organizationId: 'org_1', userId: 'usr_1', role: ORGANIZATION_ROLES.OWNER },
        ],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createEmptyTestPlanEntitlementRegistry();

      const { couponId } = await resolveOrganizationEntitlementCouponId({
        organizationId: 'org_1',
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(couponId).to.eql(undefined);
    });
  });
});
