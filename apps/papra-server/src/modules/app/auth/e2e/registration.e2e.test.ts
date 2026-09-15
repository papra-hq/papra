import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../../../config/config.test-utils';
import { createInMemoryDatabase } from '../../database/database.test-utils';
import { createServer } from '../../server';
import { createTestServerDependencies } from '../../server.test-utils';

describe('registration e2e', () => {
  describe('when registration is disabled', () => {
    test('email and password sign-up is rejected', async () => {
      const { db } = await createInMemoryDatabase();
      const config = overrideConfig({
        auth: {
          isRegistrationEnabled: false,
        },
      });
      const { app } = createServer(createTestServerDependencies({ db, config }));

      const response = await app.request('/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          name: 'Test User',
        }),
      });

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        code: 'EMAIL_PASSWORD_SIGN_UP_DISABLED',
        message: 'Email and password sign up is not enabled',
      });
    });
  });
});
