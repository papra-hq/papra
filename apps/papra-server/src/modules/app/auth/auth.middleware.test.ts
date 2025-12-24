import type { ServerInstanceGenerics } from '../server.types';
import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { PERMISSIONS } from '../../roles/roles.constants';
import { createInMemoryDatabase } from '../database/database.test-utils';
import { registerErrorMiddleware } from '../middlewares/errors.middleware';
import { createRoleMiddleware } from './auth.middleware';

describe('createRoleMiddleware', () => {
  const permissionsByRole = {
    admin: [PERMISSIONS.BO_ACCESS],
  };

  const createTestServer = ({ loggedInUserId}: { loggedInUserId: string | null }) => {
    const app = new Hono<ServerInstanceGenerics>();
    registerErrorMiddleware({ app });

    // Mock the context variables before the middleware
    app.use('*', async (c, next) => {
      c.set('userId', loggedInUserId);
      await next();
    });

    return { app };
  };

  describe('when the user has the required permission', () => {
    test('the request is allowed to proceed', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user@example.com' }],
        userRoles: [
          { userId: 'user-1', role: 'admin' },
        ],
      });

      const { app } = createTestServer({ loggedInUserId: 'user-1' });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.BO_ACCESS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ success: true });
    });
  });

  describe('when the user does not have the required permission', () => {
    test('a 401 unauthorized error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user@example.com' }],
      });

      const { app } = createTestServer({ loggedInUserId: 'user-1' });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.BO_ACCESS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });

  describe('when the user is not authenticated', () => {
    test('a 401 unauthorized error is returned', async () => {
      const { db } = await createInMemoryDatabase();

      const { app } = createTestServer({ loggedInUserId: null });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.BO_ACCESS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

      expect(response.status).to.eql(401);
      expect(await response.json()).to.eql({
        error: {
          code: 'auth.unauthorized',
          message: 'Unauthorized',
        },
      });
    });
  });

  describe('when the user has multiple permissions and one matches', () => {
    test('the request is allowed to proceed', async () => {
      const extendedPermissionsByRole = {
        admin: [PERMISSIONS.BO_ACCESS, PERMISSIONS.VIEW_USERS],
      };

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user@example.com' }],
        userRoles: [
          { userId: 'user-1', role: 'admin' },
        ],
      });

      const { app } = createTestServer({ loggedInUserId: 'user-1' });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole: extendedPermissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.VIEW_USERS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ success: true });
    });
  });

  describe('when multiple permissions are required', () => {
    test('the request is allowed if the user has all required permissions', async () => {
      const extendedPermissionsByRole = {
        admin: [PERMISSIONS.BO_ACCESS, PERMISSIONS.VIEW_USERS],
      };

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user@example.com' }],
        userRoles: [
          { userId: 'user-1', role: 'admin' },
        ],
      });

      const { app } = createTestServer({ loggedInUserId: 'user-1' });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole: extendedPermissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.BO_ACCESS, PERMISSIONS.VIEW_USERS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ success: true });
    });

    test('a 401 error is returned if the user is missing one of the required permissions', async () => {
      const extendedPermissionsByRole = {
        admin: [PERMISSIONS.BO_ACCESS],
      };

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user-1', email: 'user@example.com' }],
        userRoles: [
          { userId: 'user-1', role: 'admin' },
        ],
      });

      const { app } = createTestServer({ loggedInUserId: 'user-1' });

      const { requirePermissions } = createRoleMiddleware({ db, permissionsByRole: extendedPermissionsByRole });

      app.get(
        '/protected',
        requirePermissions({ requiredPermissions: [PERMISSIONS.BO_ACCESS, PERMISSIONS.VIEW_USERS] }),
        async c => c.json({ success: true }),
      );

      const response = await app.request('/protected', { method: 'GET' });

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
