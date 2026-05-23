import { eq } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { createServer } from '../../../app/server';
import { createTestServerDependencies } from '../../../app/server.test-utils';
import { overrideConfig } from '../../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../../organizations/organizations.constants';
import { usersTable } from '../../../users/users.table';

describe('admin users routes - permission protection', () => {
  describe('get /api/admin/users', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: 'usr_regular', email: 'user@example.com', name: 'Regular User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = (await response.json()) as { users: unknown; totalCount: number };
      expect(body.users).to.have.length(2);
      expect(body.totalCount).to.eql(2);
    });

    test('when using search parameter, it filters by email', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: 'usr_regular', email: 'user@example.com', name: 'Regular User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users?search=admin',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { users: { email: string }[]; totalCount: number };
      expect(body.users).to.have.length(1);
      expect(body.users[0]?.email).to.eql('admin@example.com');
    });

    test('when using search parameter with user ID, it returns exact match', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: 'usr_abcdefghijklmnopqrstuvwx', email: 'user@example.com', name: 'Regular User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users?search=usr_abcdefghijklmnopqrstuvwx',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { users: { id: string }[]; totalCount: number };
      expect(body.users).to.have.length(1);
      expect(body.users[0]?.id).to.eql('usr_abcdefghijklmnopqrstuvwx');
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_regular', email: 'user@example.com' }],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users',
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase();

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });

  describe('get /api/admin/users/:userId', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns user details', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_1', name: 'Organization 1' },
        ],
        organizationMembers: [
          { userId: targetUserId, organizationId: 'org_1', role: 'owner' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as {
        user: { id: string; email: string };
        organizations: { id: string; name: string }[];
        roles: string[];
      };
      expect(body.user.id).to.eql(targetUserId);
      expect(body.user.email).to.eql('target@example.com');
      expect(body.organizations).to.have.length(1);
      expect(body.organizations[0]?.id).to.eql('org_1');
      expect(body.roles).to.be.an('array');
    });

    test('when the user does not exist, a 404 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/usr_999999999999999999999999',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
          { id: targetUserId, email: 'target@example.com' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_target', email: 'target@example.com' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/usr_target',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });

  describe('delete /api/admin/users/:userId', () => {
    test('when the user has the DELETE_USERS permission and the target has no owned organizations, the user is deleted', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(204);

      const remaining = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
      expect(remaining).to.eql([]);
    });

    test('when the target user still owns an organization, a 400 error is returned and the user is not deleted', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: targetUserId, email: 'target@example.com', name: 'Target User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_1', name: 'Organization 1' },
        ],
        organizationMembers: [
          { organizationId: 'org_1', userId: targetUserId, role: ORGANIZATION_ROLES.OWNER },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        error: {
          code: 'users.still_owns_organizations',
          message: 'User still owns organizations',
        },
      });

      const remaining = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
      expect(remaining).to.have.length(1);
    });

    test('when the admin tries to delete their own account, a 400 error is returned', async () => {
      const adminUserId = 'usr_aaaaaaaaaaaaaaaaaaaaaaaa';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: adminUserId, email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: adminUserId, role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${adminUserId}`,
        { method: 'DELETE' },
        { loggedInUserId: adminUserId },
      );

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        error: {
          code: 'users.cannot_delete_self',
          message: 'Cannot delete your own account from the admin panel',
        },
      });

      const remaining = await db.select().from(usersTable).where(eq(usersTable.id, adminUserId));
      expect(remaining).to.have.length(1);
    });

    test('when the target user does not exist, a 404 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/usr_999999999999999999999999',
        { method: 'DELETE' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the DELETE_USERS permission, a 401 error is returned', async () => {
      const targetUserId = 'usr_123456789012345678901234';
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
          { id: targetUserId, email: 'target@example.com' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        `/api/admin/users/${targetUserId}`,
        { method: 'DELETE' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });

      const remaining = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
      expect(remaining).to.have.length(1);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_target', email: 'target@example.com' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/usr_target',
        { method: 'DELETE' },
      );

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });
});
