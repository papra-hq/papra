import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { createServer } from '../../../app/server';
import { createTestServerDependencies } from '../../../app/server.test-utils';
import { overrideConfig } from '../../../config/config.test-utils';
import { planEntitlementsTable } from '../../../plan-entitlements/plan-entitlements.tables';
import {
  createTestPlanEntitlementDriver,
  createTestPlanEntitlementRegistry,
} from '../../../plan-entitlements/plan-entitlements.test-utils';

describe('admin user plan entitlements routes', () => {
  describe('post /api/admin/users/:userId/plan-entitlements', () => {
    test('when the user has the MANAGE_PLAN_ENTITLEMENTS permission, the entitlement is granted with the admin source', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({
          db,
          config: overrideConfig({ env: 'test' }),
          planEntitlementDefinitionRegistry: createTestPlanEntitlementRegistry(),
        }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium' }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);

      const entitlements = await db
        .select()
        .from(planEntitlementsTable)
        .where(eq(planEntitlementsTable.userId, targetUserId));

      expect(entitlements).to.have.length(1);
      expect(entitlements[0]?.type).to.eql('selfhst-premium');
      expect(entitlements[0]?.source).to.eql('admin');
      expect(entitlements[0]?.expiresAt).to.eql(null);
      expect(entitlements[0]?.grantedAt).to.be.instanceOf(Date);
      expect(entitlements[0]?.lastVerifiedAt).to.be.instanceOf(Date);
    });

    test('when the user is not eligible for the entitlement, a 400 error is returned and no entitlement is created', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({
          db,
          config: overrideConfig({ env: 'test' }),
          planEntitlementDefinitionRegistry: createTestPlanEntitlementRegistry({
            driver: createTestPlanEntitlementDriver({ verifyEligibility: async () => false }),
          }),
        }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium' }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        error: {
          code: 'plan_entitlements.not_eligible',
          message: 'User is not eligible for this entitlement',
        },
      });

      const entitlements = await db.select().from(planEntitlementsTable);
      expect(entitlements).to.eql([]);
    });

    test('when an expiration date is provided, it is stored on the entitlement', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const expiresAt = '2027-01-01T00:00:00.000Z';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({
          db,
          config: overrideConfig({ env: 'test' }),
          planEntitlementDefinitionRegistry: createTestPlanEntitlementRegistry(),
        }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium', expiresAt }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);

      const entitlements = await db
        .select()
        .from(planEntitlementsTable)
        .where(eq(planEntitlementsTable.userId, targetUserId));

      expect(entitlements[0]?.expiresAt).to.eql(new Date(expiresAt));
    });

    test('when the user already has an entitlement of the same type, a 409 error is returned', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
        planEntitlements: [
          {
            id: 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa',
            userId: targetUserId,
            type: 'selfhst-premium',
            source: 'user-claim',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({
          db,
          config: overrideConfig({ env: 'test' }),
          planEntitlementDefinitionRegistry: createTestPlanEntitlementRegistry(),
        }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium' }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(409);
      expect(await response.json()).to.eql({
        error: {
          code: 'plan_entitlements.already_exists',
          message: 'User already has an entitlement of this type',
        },
      });
    });

    test('when the entitlement type is unknown, a 400 error is returned', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'unknown-entitlement' }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(400);
    });

    test('when the target user does not exist, a 404 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' }],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        '/api/admin/users/usr_999999999999999999999999/plan-entitlements',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium' }),
        },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the MANAGE_PLAN_ENTITLEMENTS permission, a 401 error is returned and no entitlement is created', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
          { id: targetUserId, email: 'target@example.com' },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'selfhst-premium' }),
        },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);

      const entitlements = await db.select().from(planEntitlementsTable);
      expect(entitlements).to.eql([]);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_target', email: 'target@example.com' }],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request('/api/admin/users/usr_target/plan-entitlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'selfhst-premium' }),
      });

      expect(response.status).to.eql(401);
    });
  });

  describe('delete /api/admin/users/:userId/plan-entitlements/:planEntitlementId', () => {
    test('when the user has the MANAGE_PLAN_ENTITLEMENTS permission, the entitlement is deleted', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const planEntitlementId = 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
        planEntitlements: [
          {
            id: planEntitlementId,
            userId: targetUserId,
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements/${planEntitlementId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(204);

      const remaining = await db.select().from(planEntitlementsTable);
      expect(remaining).to.eql([]);
    });

    test('when the entitlement belongs to a different user, a 404 error is returned and the entitlement is kept', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const otherUserId = 'usr_999999999999999999999999';
      const planEntitlementId = 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
          { id: otherUserId, email: 'other@example.com', name: 'Other User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
        planEntitlements: [
          {
            id: planEntitlementId,
            userId: otherUserId,
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements/${planEntitlementId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
      expect(await response.json()).to.eql({
        error: {
          code: 'plan_entitlements.not_found',
          message: 'Plan entitlement not found',
        },
      });

      const remaining = await db.select().from(planEntitlementsTable);
      expect(remaining).to.have.length(1);
    });

    test('when the entitlement does not exist, a 404 error is returned', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements/pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the MANAGE_PLAN_ENTITLEMENTS permission, a 401 error is returned and the entitlement is kept', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const planEntitlementId = 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
          { id: targetUserId, email: 'target@example.com' },
        ],
        planEntitlements: [
          {
            id: planEntitlementId,
            userId: targetUserId,
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}/plan-entitlements/${planEntitlementId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);

      const remaining = await db.select().from(planEntitlementsTable);
      expect(remaining).to.have.length(1);
    });
  });

  describe('get /api/admin/users/:userId', () => {
    test('the user detail response includes the plan entitlements and the available entitlement types', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const planEntitlementId = 'pla_ent_aaaaaaaaaaaaaaaaaaaaaaaa';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [{ userId: 'usr_admin', role: 'admin' }],
        planEntitlements: [
          {
            id: planEntitlementId,
            userId: targetUserId,
            type: 'selfhst-premium',
            source: 'admin',
            grantedAt: new Date('2026-01-01'),
          },
        ],
      });

      const { app } = createServer(
        createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }),
      );

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = (await response.json()) as {
        planEntitlements: { id: string; type: string; source: string }[];
        availablePlanEntitlementTypes: string[];
      };

      expect(body.planEntitlements).to.have.length(1);
      expect(body.planEntitlements[0]?.id).to.eql(planEntitlementId);
      expect(body.planEntitlements[0]?.type).to.eql('selfhst-premium');
      expect(body.planEntitlements[0]?.source).to.eql('admin');
      expect(body.availablePlanEntitlementTypes).to.include('selfhst-premium');
    });
  });
});
