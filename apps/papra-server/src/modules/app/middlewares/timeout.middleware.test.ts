import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { registerErrorMiddleware } from './errors.middleware';
import { timeoutMiddleware } from './timeout.middleware';

describe('middlewares', () => {
  describe('timeoutMiddleware', () => {
    test('when a request last longer than the config timeout, a 504 error is raised', async () => {
      const app = new Hono<{ Variables: { config: any } }>();
      registerErrorMiddleware({ app: app as any });

      app.use(async (context, next) => {
        context.set('config', { server: { routeTimeoutMs: 50 } });

        await next();
      });

      app.get(
        '/should-timeout',
        timeoutMiddleware,
        async (context) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return context.json({ status: 'ok' });
        },
      );

      app.get(
        '/should-not-timeout',
        timeoutMiddleware,
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
  });
});
