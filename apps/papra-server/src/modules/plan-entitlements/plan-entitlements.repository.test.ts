import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { createTestClock } from '../shared/clock/clock.test-utils';
import { createPlanEntitlementsRepository } from './plan-entitlements.repository';

describe('plan-entitlements repository', () => {
  describe('createPlanEntitlement', () => {
    test('the grantedAt date is taken from the clock', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });
      const { clock } = createTestClock({ now: Temporal.Instant.from('2026-06-01T12:00:00Z') });

      const repository = createPlanEntitlementsRepository({ db, clock });

      const { planEntitlement } = await repository.createPlanEntitlement({
        userId: 'usr_1',
        type: 'selfhst-premium',
        source: 'admin',
      });

      expect(planEntitlement?.grantedAt).to.eql(new Date('2026-06-01T12:00:00Z'));
      expect(planEntitlement?.expiresAt).to.eql(null);
      expect(planEntitlement?.source).to.eql('admin');
    });

    test('when the user already has an entitlement of the same type, an already-exists error is raised', async () => {
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

      const repository = createPlanEntitlementsRepository({ db });

      await expect(
        repository.createPlanEntitlement({
          userId: 'usr_1',
          type: 'selfhst-premium',
          source: 'admin',
        }),
      ).rejects.toThrowError('User already has an entitlement of this type');
    });
  });

  describe('getUserPlanEntitlements', () => {
    test('only the entitlements of the given user are returned, including expired ones', async () => {
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
            grantedAt: new Date('2026-01-01'),
            expiresAt: new Date('2026-02-01'),
          },
          {
            id: 'pla_ent_bbbbbbbbbbbbbbbbbbbbbbbb',
            userId: 'usr_2',
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const repository = createPlanEntitlementsRepository({ db });

      const { planEntitlements } = await repository.getUserPlanEntitlements({ userId: 'usr_1' });

      expect(planEntitlements).to.have.length(1);
      expect(planEntitlements[0]?.id).to.eql('pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa');
      expect(planEntitlements[0]?.expiresAt).to.eql(new Date('2026-02-01'));
    });
  });

  describe('deleteUserPlanEntitlement', () => {
    test('the entitlement is deleted when it belongs to the given user', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: 'usr_1',
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const repository = createPlanEntitlementsRepository({ db });

      await repository.deleteUserPlanEntitlement({
        planEntitlementId: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
        userId: 'usr_1',
      });

      const { planEntitlements } = await repository.getUserPlanEntitlements({ userId: 'usr_1' });
      expect(planEntitlements).to.eql([]);
    });

    test('when the entitlement belongs to another user, a not-found error is raised and the entitlement is kept', async () => {
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
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const repository = createPlanEntitlementsRepository({ db });

      await expect(
        repository.deleteUserPlanEntitlement({
          planEntitlementId: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
          userId: 'usr_2',
        }),
      ).rejects.toThrowError('Plan entitlement not found');

      const { planEntitlements } = await repository.getUserPlanEntitlements({ userId: 'usr_1' });
      expect(planEntitlements).to.have.length(1);
    });

    test('when the entitlement does not exist, a not-found error is raised', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_1', email: 'user-1@example.com' }],
      });

      const repository = createPlanEntitlementsRepository({ db });

      await expect(
        repository.deleteUserPlanEntitlement({
          planEntitlementId: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
          userId: 'usr_1',
        }),
      ).rejects.toThrowError('Plan entitlement not found');
    });
  });
});
