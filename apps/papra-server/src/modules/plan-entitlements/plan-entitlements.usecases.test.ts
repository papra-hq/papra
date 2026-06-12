import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestClock } from '../shared/clock/clock.test-utils';
import { createPlanEntitlementsRepository } from './plan-entitlements.repository';
import {
  createEmptyTestPlanEntitlementRegistry,
  createTestPlanEntitlementDriver,
  createTestPlanEntitlementRegistry,
} from './plan-entitlements.test-utils';
import { grantUserPlanEntitlement } from './plan-entitlements.usecases';

describe('plan-entitlements usecases', () => {
  describe('grantUserPlanEntitlement', () => {
    test('when the user is eligible, the entitlement is created and marked as verified', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db, clock });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => true }),
      });

      const { planEntitlement } = await grantUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        source: 'admin',
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

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => false }),
      });

      await expect(
        grantUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          source: 'admin',
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('User is not eligible for this entitlement');

      const { planEntitlements } = await planEntitlementsRepository.getUserPlanEntitlements({
        userId: 'usr_1',
      });
      expect(planEntitlements).to.eql([]);
    });

    test('the eligibility is verified for the target user', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const verifiedUserIds: string[] = [];
      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createTestPlanEntitlementRegistry({
        driver: createTestPlanEntitlementDriver({
          verifyEligibility: async ({ userId }) => {
            verifiedUserIds.push(userId);
            return true;
          },
        }),
      });

      await grantUserPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        source: 'admin',
        planEntitlementsRepository,
        planEntitlementDefinitionRegistry,
      });

      expect(verifiedUserIds).to.eql(['usr_1']);
    });

    test('when no driver exists for the entitlement type, an unknown-type error is raised', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const planEntitlementsRepository = createPlanEntitlementsRepository({ db });
      const planEntitlementDefinitionRegistry = createEmptyTestPlanEntitlementRegistry();

      await expect(
        grantUserPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          source: 'admin',
          planEntitlementsRepository,
          planEntitlementDefinitionRegistry,
        }),
      ).rejects.toThrowError('Unknown plan entitlement type');
    });
  });
});
