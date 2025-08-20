import type { Document } from '../documents.types';
import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { overrideConfig } from '../../config/config.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { documentsTable } from '../documents.table';
import { inMemoryStorageDriverFactory } from '../storage/drivers/memory/memory.storage-driver';

describe('documents e2e', () => {
  describe('document upload', () => {
    test('upload and retrieve a document', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
        organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
        organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
      });

      const { app } = await createServer({
        db,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            driver: 'in-memory',
          },
        }),
      });

      const formData = new FormData();
      formData.append('file', new File(['this is an invoice'], 'invoice.txt', { type: 'text/plain' }));
      const body = new Response(formData);

      const createDocumentResponse = await app.request(
        '/api/organizations/org_222222222222222222222222/documents',
        {
          method: 'POST',
          headers: {
            ...Object.fromEntries(body.headers.entries()),
          },
          body: await body.arrayBuffer(),
        },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(createDocumentResponse.status).to.eql(200);
      const { document } = (await createDocumentResponse.json()) as { document: Document };

      expect(document).to.include({
        name: 'invoice.txt',
        mimeType: 'text/plain',
        originalSha256Hash: 'd80fa6177614300f12fd51d065c06c2e1154653662aefb2794807ef31daf4039',
        originalSize: 18,
      });

      // Retrieve the document
      const getDocumentResponse = await app.request(
        `/api/organizations/org_222222222222222222222222/documents/${document.id}`,
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(getDocumentResponse.status).to.eql(200);
      const { document: retrievedDocument } = (await getDocumentResponse.json()) as { document: Document };

      expect(retrievedDocument).to.eql({ ...document, tags: [] });

      // Retrieve the document file
      const getDocumentFileResponse = await app.request(
        `/api/organizations/org_222222222222222222222222/documents/${document.id}/file`,
        { method: 'GET' },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(getDocumentFileResponse.status).to.eql(200);
      const content = await getDocumentFileResponse.text();
      expect(content).to.eql('this is an invoice');
    });

    test('uploading a document that exceeds the upload size limit returns a 413', async () => {
      const { db } = await createInMemoryDatabase({
        users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
        organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
        organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
      });

      const documentsStorageService = inMemoryStorageDriverFactory();

      const { app } = await createServer({
        db,
        documentsStorageService,
        config: overrideConfig({
          env: 'test',
          documentsStorage: {
            maxUploadSize: 100,
          },
        }),
      });

      const formData = new FormData();
      formData.append('file', new File(['a'.repeat(101)], 'invoice.txt', { type: 'text/plain' }));
      const body = new Response(formData);

      const createDocumentResponse = await app.request(
        '/api/organizations/org_222222222222222222222222/documents',
        {
          method: 'POST',
          headers: {
            ...Object.fromEntries(body.headers.entries()),
          },
          body: await body.arrayBuffer(),
        },
        { loggedInUserId: 'usr_111111111111111111111111' },
      );

      expect(createDocumentResponse.status).to.eql(413);
      expect(await createDocumentResponse.json()).to.eql({
        error: {
          code: 'document.size_too_large',
          message: 'Document size too large.',
        },
      });

      // Ensure no document is saved in the db
      const documentRecords = await db.select().from(documentsTable);
      expect(documentRecords.length).to.eql(0);

      // Ensure no file is saved in the storage
      expect(documentsStorageService._getStorage().size).to.eql(0);
    });
  });
});
