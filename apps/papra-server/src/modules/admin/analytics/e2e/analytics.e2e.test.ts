import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { createServer } from '../../../app/server';
import { createTestServerDependencies } from '../../../app/server.test-utils';
import { overrideConfig } from '../../../config/config.test-utils';

describe('analytics routes - permission protection', () => {
  describe('get /api/admin/users/count', () => {
    test('when the user has the VIEW_ANALYTICS permission, the request succeeds', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com' },
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/count',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json();
      expect(body).to.eql({ userCount: 2 });
    });

    test('when the user does not have the VIEW_ANALYTICS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_regular', email: 'user@example.com' }],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/users/count',
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
        '/api/admin/users/count',
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
});
