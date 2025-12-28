import type { ServerInstanceGenerics } from '../server.types';
import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../config/config.test-utils';
import { registerErrorMiddleware } from './errors.middleware';
import { createTimeoutMiddleware } from './timeout.middleware';

describe('middlewares', () => {
  describe('timeoutMiddleware', () => {
    test('when a request last longer than the config timeout, a 504 error is raised', async () => {
      const config = overrideConfig({ server: { defaultRouteTimeoutMs: 50 } });

      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      app.get(
        '/should-timeout',
        createTimeoutMiddleware({ config }),
        async (context) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return context.json({ status: 'ok' });
        },
      );

      app.get(
        '/should-not-timeout',
        createTimeoutMiddleware({ config }),
        async (context) => {
          return context.json({ status: 'ok' });
        },
      );

      const response1 = await app.request('/should-timeout', { method: 'GET' });

      expect(response1.status).to.eql(504);
      expect(await response1.json()).to.eql({
        error: {
          code: 'api.timeout',
          message: 'The request timed out',
        },
      });

      const response2 = await app.request('/should-not-timeout', { method: 'GET' });

      expect(response2.status).to.eql(200);
      expect(await response2.json()).to.eql({ status: 'ok' });
    });

    test('route-specific timeout overrides default timeout for matching routes', async () => {
      const config = overrideConfig({
        server: {
          defaultRouteTimeoutMs: 50,
          routeTimeouts: [
            {
              method: 'POST',
              route: '/api/upload/:id',
              timeoutMs: 200,
            },
          ],
        },
      });

      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      // POST to matching route with longer timeout - should not timeout
      app.post(
        '/api/upload/:id',
        createTimeoutMiddleware({ config }),
        async (context) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return context.json({ status: 'ok' });
        },
      );

      // GET to same route - should timeout with default
      app.get(
        '/api/upload/:id',
        createTimeoutMiddleware({ config }),
        async (context) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return context.json({ status: 'ok' });
        },
      );

      // Different route - should timeout with default
      app.post(
        '/api/other',
        createTimeoutMiddleware({ config }),
        async (context) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return context.json({ status: 'ok' });
        },
      );

      // POST to matching pattern should succeed
      const response1 = await app.request('/api/upload/123', { method: 'POST' });
      expect(response1.status).to.eql(200);

      // GET to same path should timeout (method mismatch)
      const response2 = await app.request('/api/upload/123', { method: 'GET' });
      expect(response2.status).to.eql(504);

      // POST to different path should timeout (path mismatch)
      const response3 = await app.request('/api/other', { method: 'POST' });
      expect(response3.status).to.eql(504);
    });

    test('when registered globally with .use(), route-specific timeouts should work', async () => {
      const config = overrideConfig({
        server: {
          defaultRouteTimeoutMs: 50,
          routeTimeouts: [
            {
              method: 'POST',
              route: '/api/organizations/:orgId/documents',
              timeoutMs: 200,
            },
          ],
        },
      });

      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      // Register middleware globally (like in server.ts)
      app.use(createTimeoutMiddleware({ config }));

      // Route that should have extended timeout
      app.post('/api/organizations/:orgId/documents', async (context) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return context.json({ status: 'upload ok' });
      });

      // Route that should use default timeout
      app.get('/api/other', async (context) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return context.json({ status: 'ok' });
      });

      // POST to upload route should succeed (extended timeout)
      const response1 = await app.request('/api/organizations/org-123/documents', { method: 'POST' });
      expect(response1.status).to.eql(200);
      expect(await response1.json()).to.eql({ status: 'upload ok' });

      // GET to other route should timeout (default timeout)
      const response2 = await app.request('/api/other', { method: 'GET' });
      expect(response2.status).to.eql(504);
    });
  });
});
