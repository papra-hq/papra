import { inspectRoutes } from 'hono/dev';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from './database/database.test-utils';
import { createServer } from './server';

function setValidParams(path: string) {
  const newPath = path
    .replaceAll(':organizationId', 'org_111111111111111111111111')
    .replaceAll(':userId', 'user_222222222222222222222222')
    .replaceAll(':documentId', 'doc_333333333333333333333333')
    .replaceAll(':tagId', 'tag_444444444444444444444444')
    .replaceAll(':taggingRuleId', 'rule_555555555555555555555555')
    .replaceAll(':intakeEmailId', 'email_666666666666666666666666')
    .replaceAll(':apiKeyId', 'api_key_777777777777777777777777')
    .replaceAll(':webhookId', 'wbh_888888888888888888888888')
    .replaceAll(':memberId', 'org_mem_999999999999999999999999')
    .replaceAll(':invitationId', 'inv_101010101010101010101010');

  // throw if there are any remaining params
  if (newPath.match(/:(\w+)/g)) {
    throw new Error(`Add a dummy value for the params in ${path}`);
  }

  return newPath;
}

describe('server routes', () => {
  test('all routes should respond with a 401 when non-authenticated, except for public and auth-related routes', async () => {
    const { db } = await createInMemoryDatabase();
    const { app } = await createServer({ db });

    const publicRoutes = [
      'GET /api/ping',
      'GET /api/health',
      'GET /api/config',

      // Authentication is handled by payload signature verification
      'POST /api/intake-emails/ingest',

      // Stripe stuff
      'POST /api/stripe/webhook',
    ];

    // Excluding auth routes that are managed by better-auth
    const authRoutesPrefix = '/api/auth';

    const routes = inspectRoutes(app)
      .filter(route => !route.isMiddleware)
      .filter(route => !publicRoutes.includes(`${route.method} ${route.path}`))
      .filter(route => !route.path.startsWith(authRoutesPrefix));

    for (const route of routes) {
      const response = await app.request(
        setValidParams(route.path),
        {
          method: route.method,
        },
      );

      expect(response.status).to.eql(
        401,
        `Route ${route.method} ${route.path} did not return 401 when not authenticated`,
      );
      expect(await response.json()).to.eql({
        error: {
          message: 'Unauthorized',
          code: 'auth.unauthorized',
        },
      });
    }
  });
});
