import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { overrideConfig } from '../../config/config.test-utils';

function buildBody({ attachments = [], from, to }: { attachments?: File[]; from: { address: string; name: string }; to: { address: string; name: string }[] }) {
  const formData = new FormData();
  formData.append('meta', JSON.stringify({ from, to }));
  attachments.forEach((attachment) => {
    formData.append('attachments[]', attachment);
  });

  return formData;
}

describe('intake-emails e2e', () => {
  describe('ingest an intake email', () => {
    test('when intake email ingestion is disabled, a 403 is returned', async () => {
      const { db } = await createInMemoryDatabase();
      const { app } = createServer({
        db,
        config: overrideConfig({
          intakeEmails: {
            isEnabled: false,
          },
        }),
      });

      const response = await app.request('/api/intake-emails/ingest', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
        body: buildBody({
          from: { address: 'foo@example.fr', name: 'Foo' },
          to: [{ address: 'bar@example.fr', name: 'Bar' }],
        }),
      });

      expect(response.status).to.eql(403);
      expect(await response.json()).to.eql({
        error: {
          code: 'intake_emails.disabled',
          message: 'Intake emails are disabled',
        },
      });
    });

    describe('when ingesting an email, the request must have an bearer authorization header with the token specified in the config', async () => {
      test('when the header is missing or invalid, a 401 is returned', async () => {
        const { db } = await createInMemoryDatabase();
        const { app } = createServer({
          db,
          config: overrideConfig({
            intakeEmails: {
              isEnabled: true,
              webhookSecret: 'super-secret',
            },
          }),
        });

        const response = await app.request('/api/intake-emails/ingest', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer invalid-token',
          },
          body: buildBody({
            from: { address: 'foo@example.fr', name: 'Foo' },
            to: [{ address: 'bar@example.fr', name: 'Bar' }],
          }),
        });

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
});