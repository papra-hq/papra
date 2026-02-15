import type { Document } from '../../documents/documents.types';
import { serializeEmailForWebhook, signBody } from '@owlrelay/webhook';
import { pick } from 'lodash-es';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { MIME_TYPES } from '../../shared/mime-types/mime-types.constants';

describe('intake-emails e2e', () => {
  describe('ingest an intake email', () => {
    test('when intake email ingestion is disabled, a 403 is returned', async () => {
      const { db } = await createInMemoryDatabase();
      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          intakeEmails: {
            isEnabled: false,
          },
        }),
      }));

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
        const { app } = createServer(createTestServerDependencies({
          db,
          config: overrideConfig({
            intakeEmails: {
              isEnabled: true,
              webhookSecret: 'super-secret',
            },
          }),
        }));

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
        const { app } = createServer(createTestServerDependencies({
          db,
          config: overrideConfig({
            intakeEmails: {
              isEnabled: true,
              webhookSecret: 'super-secret',
            },
          }),
        }));

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
        users: [{ id: 'usr_111111111111111111111111', email: 'foo@example.fr' }],
        organizations: [{ id: 'org_111111111111111111111111', name: 'Organization 1' }],
        organizationMembers: [{ id: 'org_member_1', organizationId: 'org_111111111111111111111111', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
        intakeEmails: [{ id: 'ie_1', organizationId: 'org_111111111111111111111111', emailAddress: 'email-1@papra.email', allowedOrigins: ['foo@example.fr'] }],
      });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          intakeEmails: { isEnabled: true, webhookSecret: 'super-secret' },
        }),
      }));

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

      const ingestionResponse = await app.request('/api/intake-emails/ingest', {
        method: 'POST',
        headers,
        body: bodyArrayBuffer,
      });

      expect(ingestionResponse.status).to.eql(202);

      const documentsResponse = await app.request(
        '/api/organizations/org_111111111111111111111111/documents',
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(documentsResponse.status).to.eql(200);
      const { documents } = await documentsResponse.json() as { documents: Document[] };

      expect(documents).to.have.length(1);

      const document = documents[0]!;

      expect(
        pick(document, ['organizationId', 'createdBy', 'mimeType', 'originalName', 'originalSize']),
      ).to.eql({
        organizationId: 'org_111111111111111111111111',
        createdBy: null,
        mimeType: 'text/plain',
        originalName: 'test.txt',
        originalSize: 11,
      });

      const storedFileContentResponse = await app.request(
        `/api/organizations/org_111111111111111111111111/documents/${document.id}/file`,
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(storedFileContentResponse.status).to.eql(200);
      const storedFileContent = await storedFileContentResponse.text();

      expect(storedFileContent).to.eql('hello world');
    });

    test('when the attachment is a PDF with an octet-stream mime type, the mime type is correctly detected and the file is stored with the correct mime type', async () => {
      const minimalPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]);

      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_111111111111111111111111', email: 'foo@example.fr' }],
        organizations: [{ id: 'org_111111111111111111111111', name: 'Organization 1' }],
        organizationMembers: [{ id: 'org_member_1', organizationId: 'org_111111111111111111111111', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
        intakeEmails: [{ id: 'ie_1', organizationId: 'org_111111111111111111111111', emailAddress: 'email-1@papra.email', allowedOrigins: ['foo@example.fr'] }],
      });

      const { app } = createServer(createTestServerDependencies({
        db,
        config: overrideConfig({
          env: 'test',
          intakeEmails: { isEnabled: true, webhookSecret: 'super-secret' },
        }),
      }));

      const { body } = serializeEmailForWebhook({ email: {
        from: { address: 'foo@example.fr', name: 'Foo' },
        to: [{ address: 'email-1@papra.email', name: 'Bar' }],
        attachments: [{ filename: 'test.pdf', mimeType: MIME_TYPES.OCTET_STREAM, content: minimalPdfBytes.buffer }],
      } });
      const bodyResponse = new Response(body);
      const headers = Object.fromEntries(bodyResponse.headers.entries());
      const bodyArrayBuffer = await bodyResponse.arrayBuffer();
      const { signature } = await signBody({ bodyBuffer: bodyArrayBuffer, secret: 'super-secret' });

      headers['X-Signature'] = signature;

      const ingestionResponse = await app.request('/api/intake-emails/ingest', {
        method: 'POST',
        headers,
        body: bodyArrayBuffer,
      });

      expect(ingestionResponse.status).to.eql(202);

      const documentsResponse = await app.request(
        '/api/organizations/org_111111111111111111111111/documents',
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(documentsResponse.status).to.eql(200);
      const { documents } = await documentsResponse.json() as { documents: Document[] };

      expect(documents).to.have.length(1);

      const document = documents[0]!;

      expect(
        pick(document, ['organizationId', 'createdBy', 'mimeType', 'originalName', 'originalSize']),
      ).to.eql({
        organizationId: 'org_111111111111111111111111',
        createdBy: null,
        mimeType: 'application/pdf',
        originalName: 'test.pdf',
        originalSize: minimalPdfBytes.length,
      });

      const storedFileContentResponse = await app.request(
        `/api/organizations/org_111111111111111111111111/documents/${document.id}/file`,
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(storedFileContentResponse.status).to.eql(200);
      const storedFileContent = new Uint8Array(await storedFileContentResponse.arrayBuffer());

      expect(storedFileContent).to.eql(minimalPdfBytes);
    });
  });
});
