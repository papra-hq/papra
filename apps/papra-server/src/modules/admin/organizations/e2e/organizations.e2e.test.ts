import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../../app/database/database.test-utils';
import { createServer } from '../../../app/server';
import { createTestServerDependencies } from '../../../app/server.test-utils';
import { overrideConfig } from '../../../config/config.test-utils';

describe('admin organizations routes - permission protection', () => {
  describe('get /api/admin/organizations', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Organization 1' },
          { id: 'org_abcdefghijklmnopqrstuvwx', name: 'Organization 2' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = (await response.json()) as { organizations: unknown; totalCount: number };
      expect(body.organizations).to.have.length(2);
      expect(body.totalCount).to.eql(2);
    });

    test('when using search parameter, it filters by name', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_alpha123456789012345678', name: 'Alpha Corporation' },
          { id: 'org_beta1234567890123456789', name: 'Beta LLC' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations?search=Alpha',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { organizations: { name: string }[]; totalCount: number };
      expect(body.organizations).to.have.length(1);
      expect(body.organizations[0]?.name).to.eql('Alpha Corporation');
    });

    test('when using search parameter with organization ID, it returns exact match', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Alpha Corporation' },
          { id: 'org_abcdefghijklmnopqrstuvwx', name: 'Beta LLC' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations?search=org_abcdefghijklmnopqrstuvwx',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { organizations: { id: string }[]; totalCount: number };
      expect(body.organizations).to.have.length(1);
      expect(body.organizations[0]?.id).to.eql('org_abcdefghijklmnopqrstuvwx');
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_regular', email: 'user@example.com' }],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations',
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
        '/api/admin/organizations',
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

  describe('get /api/admin/organizations/:organizationId', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns organization basic info', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { organization: { id: string; name: string } };
      expect(body.organization.id).to.eql('org_123456789012345678901234');
      expect(body.organization.name).to.eql('Test Organization');
    });

    test('when the organization does not exist, a 404 error is returned', async () => {
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
        '/api/admin/organizations/org_999999999999999999999999',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234',
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
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234',
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

  describe('get /api/admin/organizations/:organizationId/members', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns members', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
          { id: 'usr_member', email: 'member@example.com', name: 'Member User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
        organizationMembers: [
          { userId: 'usr_member', organizationId: 'org_123456789012345678901234', role: 'member' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/members',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { members: { userId: string; role: string }[] };
      expect(body.members).to.have.length(1);
      expect(body.members[0]?.userId).to.eql('usr_member');
      expect(body.members[0]?.role).to.eql('member');
    });

    test('when the organization does not exist, a 404 error is returned', async () => {
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
        '/api/admin/organizations/org_999999999999999999999999/members',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/members',
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/members',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
    });
  });

  describe('get /api/admin/organizations/:organizationId/intake-emails', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns intake emails', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
        intakeEmails: [
          { organizationId: 'org_123456789012345678901234', emailAddress: 'intake@example.com', isEnabled: true },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/intake-emails',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { intakeEmails: { emailAddress: string; isEnabled: boolean }[] };
      expect(body.intakeEmails).to.have.length(1);
      expect(body.intakeEmails[0]?.emailAddress).to.eql('intake@example.com');
    });

    test('when the organization does not exist, a 404 error is returned', async () => {
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
        '/api/admin/organizations/org_999999999999999999999999/intake-emails',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/intake-emails',
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/intake-emails',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
    });
  });

  describe('get /api/admin/organizations/:organizationId/webhooks', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns webhooks', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
        webhooks: [
          { organizationId: 'org_123456789012345678901234', name: 'Test Webhook', url: 'https://example.com/webhook', enabled: true },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/webhooks',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { webhooks: { name: string; url: string; enabled: boolean }[] };
      expect(body.webhooks).to.have.length(1);
      expect(body.webhooks[0]?.name).to.eql('Test Webhook');
    });

    test('when the organization does not exist, a 404 error is returned', async () => {
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
        '/api/admin/organizations/org_999999999999999999999999/webhooks',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/webhooks',
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/webhooks',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
    });
  });

  describe('get /api/admin/organizations/:organizationId/stats', () => {
    test('when the user has the VIEW_USERS permission, the request succeeds and returns stats', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_admin', email: 'admin@example.com', name: 'Admin User' },
        ],
        userRoles: [
          { userId: 'usr_admin', role: 'admin' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/stats',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(200);
      const body = await response.json() as { stats: { documentsCount: number; documentsSize: number } };
      expect(body.stats).to.have.property('documentsCount');
      expect(body.stats).to.have.property('documentsSize');
    });

    test('when the organization does not exist, a 404 error is returned', async () => {
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
        '/api/admin/organizations/org_999999999999999999999999/stats',
        { method: 'GET' },
        { loggedInUserId: 'usr_admin' },
      );

      expect(response.status).to.eql(404);
    });

    test('when the user does not have the VIEW_USERS permission, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        users: [
          { id: 'usr_regular', email: 'user@example.com' },
        ],
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/stats',
        { method: 'GET' },
        { loggedInUserId: 'usr_regular' },
      );

      expect(response.status).to.eql(401);
    });

    test('when the user is not authenticated, a 401 error is returned', async () => {
      const { db } = await createInMemoryDatabase({
        organizations: [
          { id: 'org_123456789012345678901234', name: 'Test Organization' },
        ],
      });

      const { app } = createServer(createTestServerDependencies({ db, config: overrideConfig({ env: 'test' }) }));

      const response = await app.request(
        '/api/admin/organizations/org_123456789012345678901234/stats',
        { method: 'GET' },
      );

      expect(response.status).to.eql(401);
    });
  });
});
