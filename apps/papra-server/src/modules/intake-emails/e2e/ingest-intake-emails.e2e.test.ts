import { serializeEmailForWebhook, signBody } from '@owlrelay/webhook';
import { pick } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { overrideConfig } from '../../config/config.test-utils';
import { documentsTable } from '../../documents/documents.table';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';

describe('intake-emails e2e', () => {
  describe('ingest an intake email', () => {
    test('when intake email ingestion is disabled, a 403 is returned', async () => {
      const { db } = await createInMemoryDatabase();
      const { app } = await createServer({
        db,
        config: overrideConfig({
          intakeEmails: {
            isEnabled: false,
          },
        }),
      });

      const { body } = serializeEmailForWebhook({ email: {
        from: { address: 'foo@example.fr', name: 'Foo' },
        to: [{ address: 'bar@example.fr', name: 'Bar' }],
      } });

      const response = await app.request('/api/intake-emails/ingest', {
        method: 'POST',
        body,
      });

      expect(response.status).to.eql(403);
      expect(await response.json()).to.eql({
        error: {
          code: 'intake_emails.disabled',
          message: 'Intake emails are disabled',
        },
      });
    });

    describe('when ingesting an email, the request must have an X-Signature header with the hmac signature of the body', async () => {
      test('when the header is missing, a 400 is returned', async () => {
        const { db } = await createInMemoryDatabase();
        const { app } = await createServer({
          db,
          config: overrideConfig({
            intakeEmails: {
              isEnabled: true,
              webhookSecret: 'super-secret',
            },
          }),
        });

        const { body } = serializeEmailForWebhook({ email: {
          from: { address: 'foo@example.fr', name: 'Foo' },
          to: [{ address: 'bar@example.fr', name: 'Bar' }],
        } });

        const response = await app.request('/api/intake-emails/ingest', {
          method: 'POST',
          body,
        });

        expect(response.status).to.eql(400);
        expect(await response.json()).to.eql({
          error: {
            code: 'intake_emails.signature_header_required',
            message: 'Signature header is required',
          },
        });
      });

      test('when the header is invalid, a 401 is returned', async () => {
        const { db } = await createInMemoryDatabase();
        const { app } = await createServer({
          db,
          config: overrideConfig({
            intakeEmails: {
              isEnabled: true,
              webhookSecret: 'super-secret',
            },
          }),
        });

        const { body } = serializeEmailForWebhook({ email: {
          from: { address: 'foo@example.fr', name: 'Foo' },
          to: [{ address: 'bar@example.fr', name: 'Bar' }],
        } });

        const response = await app.request('/api/intake-emails/ingest', {
          method: 'POST',
          headers: {
            'X-Signature': 'invalid',
          },
          body,
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

    test('when the ingestion is enabled and the request signature is valid, the email attachments are added to the organization', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'user_1', email: 'foo@example.fr' }],
        organizations: [{ id: 'org_1', name: 'Organization 1' }],
        organizationMembers: [{ id: 'org_member_1', organizationId: 'org_1', userId: 'user_1', role: ORGANIZATION_ROLES.OWNER }],
        intakeEmails: [{ id: 'ie_1', organizationId: 'org_1', emailAddress: 'email-1@papra.email', allowedOrigins: ['foo@example.fr'] }],
      });

      const { app } = await createServer({
        db,
        config: overrideConfig({
          intakeEmails: { isEnabled: true, webhookSecret: 'super-secret' },
        }),
      });

      const { body } = serializeEmailForWebhook({ email: {
        from: { address: 'foo@example.fr', name: 'Foo' },
        to: [{ address: 'email-1@papra.email', name: 'Bar' }],
        attachments: [{ filename: 'test.txt', mimeType: 'text/plain', content: 'hello world' }],

        // unused fields, but very likely to be present in the payload
        subject: 'Hello world',
        cc: [{ address: 'cc@example.fr', name: 'Cc' }],
        html: '<p>Hello world</p>',
        text: 'Hello world',
      } });
      const bodyResponse = new Response(body);
      const headers = Object.fromEntries(bodyResponse.headers.entries());
      const bodyArrayBuffer = await bodyResponse.arrayBuffer();
      const { signature } = await signBody({ bodyBuffer: bodyArrayBuffer, secret: 'super-secret' });

      headers['X-Signature'] = signature;

      const response = await app.request('/api/intake-emails/ingest', {
        method: 'POST',
        headers,
        body: bodyArrayBuffer,
      });

      expect(response.status).to.eql(202);

      const documents = await db.select().from(documentsTable);

      expect(documents).to.have.length(1);

      const [document] = documents;

      expect(
        pick(document, ['organizationId', 'createdBy', 'mimeType', 'originalName', 'originalSize', 'content']),
      ).to.eql({
        organizationId: 'org_1',
        createdBy: null,
        mimeType: 'text/plain',
        originalName: 'test.txt',
        originalSize: 11,
        content: 'hello world',
      });
    });
  });
});
