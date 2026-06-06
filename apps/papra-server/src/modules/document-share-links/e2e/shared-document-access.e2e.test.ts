import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../../app/database/database.test-utils';
import { createServer } from '../../app/server';
import { createTestServerDependencies } from '../../app/server.test-utils';
import { overrideConfig } from '../../config/config.test-utils';
import { createInMemoryDocumentStorageServices } from '../../documents/storage/documents.storage.services.test-utils';
import { ORGANIZATION_ROLES } from '../../organizations/organizations.constants';
import { createReadableStream } from '../../shared/streams/readable-stream';

const config = overrideConfig({
  env: 'test',
  auth: { secret: 'test-secret-that-is-at-least-32-chars-long' },
  documentsStorage: { driver: 'in-memory' },
});

async function createTestApp() {
  const document = {
    id: 'doc_333333333333333333333333',
    name: 'invoice.pdf',
    storageKey: 'org_222222222222222222222222/originals/doc_333333333333333333333333.pdf',
    mimeType: 'application/pdf',
  };

  const { db } = await createInMemoryDatabase({
    users: [{ id: 'usr_111111111111111111111111', email: 'user@example.com' }],
    organizations: [{ id: 'org_222222222222222222222222', name: 'Org 1' }],
    organizationMembers: [{ organizationId: 'org_222222222222222222222222', userId: 'usr_111111111111111111111111', role: ORGANIZATION_ROLES.OWNER }],
    documents: [{
      id: document.id,
      organizationId: 'org_222222222222222222222222',
      name: document.name,
      originalName: document.name,
      originalSize: 1024,
      originalStorageKey: document.storageKey,
      originalSha256Hash: 'hash_1',
      mimeType: document.mimeType,
    }],
  });

  const documentsStorageService = createInMemoryDocumentStorageServices();

  await documentsStorageService.saveFile({
    fileName: document.name,
    storageKey: document.storageKey,
    mimeType: document.mimeType,
    fileStream: createReadableStream({ content: 'File content.' }),
  });

  const { app } = createServer(createTestServerDependencies({ db, config, documentsStorageService }));

  return { app };
}

describe('shared document access e2e', () => {
  test('a password-protected document can be accessed with the access token issued after password verification', async () => {
    const { app } = await createTestApp();

    const createResponse = await app.request(
      '/api/organizations/org_222222222222222222222222/documents/doc_333333333333333333333333/share-links',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'hunter2' }),
      },
      { loggedInUserId: 'usr_111111111111111111111111' },
    );

    expect(createResponse.status).toBe(201);
    const { shareLink } = await createResponse.json() as { shareLink: { token: string } };

    // Without an access token, the protected document is gated behind a 401.
    const unauthenticatedDocumentResponse = await app.request(`/api/share-links/${shareLink.token}/document`);
    expect(unauthenticatedDocumentResponse.status).toBe(401);
    expect(await unauthenticatedDocumentResponse.json()).toMatchObject({ error: { code: 'share_link.password_required' } });

    const unauthenticatedFileResponse = await app.request(`/api/share-links/${shareLink.token}/document/file`);
    expect(unauthenticatedFileResponse.status).toBe(401);

    // Verifying the password yields a short-lived access token.
    const verifyResponse = await app.request(`/api/share-links/${shareLink.token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'hunter2' }),
    });

    expect(verifyResponse.status).toBe(200);
    const { accessToken } = await verifyResponse.json() as { accessToken: string };
    expect(accessToken).toEqual(expect.any(String));

    // The access token, sent as a Bearer header, must grant access to the document.
    const authenticatedResponse = await app.request(`/api/share-links/${shareLink.token}/document`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(authenticatedResponse.status).toBe(200);
    expect(await authenticatedResponse.json()).toEqual({
      document: { name: 'invoice.pdf', size: 1024, mimeType: 'application/pdf' },
    });

    const authenticatedFileResponse = await app.request(`/api/share-links/${shareLink.token}/document/file`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(authenticatedFileResponse.status).toBe(200);
    expect(await authenticatedFileResponse.text()).toBe('File content.');
  });

  test('a passwordless document can be accessed without any access token', async () => {
    const { app } = await createTestApp();

    const createResponse = await app.request(
      '/api/organizations/org_222222222222222222222222/documents/doc_333333333333333333333333/share-links',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      { loggedInUserId: 'usr_111111111111111111111111' },
    );

    expect(createResponse.status).toBe(201);
    const { shareLink } = await createResponse.json() as { shareLink: { token: string } };

    // No password gate: the document is reachable straight away.
    const documentResponse = await app.request(`/api/share-links/${shareLink.token}/document`);

    expect(documentResponse.status).toBe(200);
    expect(await documentResponse.json()).toEqual({
      document: { name: 'invoice.pdf', size: 1024, mimeType: 'application/pdf' },
    });

    const fileResponse = await app.request(`/api/share-links/${shareLink.token}/document/file`);

    expect(fileResponse.status).toBe(200);
    expect(await fileResponse.text()).toBe('File content.');

    // Verifying a password against a passwordless link is a client error.
    const verifyResponse = await app.request(`/api/share-links/${shareLink.token}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'hunter2' }),
    });

    expect(verifyResponse.status).toBe(400);
    expect(await verifyResponse.json()).toMatchObject({ error: { code: 'share_link.not_password_protected' } });
  });

  test('a trashed document is no longer reachable through its share link, and access resumes once it is restored', async () => {
    const { app } = await createTestApp();

    const createResponse = await app.request(
      '/api/organizations/org_222222222222222222222222/documents/doc_333333333333333333333333/share-links',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
      { loggedInUserId: 'usr_111111111111111111111111' },
    );

    expect(createResponse.status).toBe(201);
    const { shareLink } = await createResponse.json() as { shareLink: { token: string } };

    // Sanity check: the link works while the document is live.
    expect((await app.request(`/api/share-links/${shareLink.token}/document`)).status).toBe(200);

    // Trash (soft-delete) the document.
    const trashResponse = await app.request(
      '/api/organizations/org_222222222222222222222222/documents/doc_333333333333333333333333',
      { method: 'DELETE' },
      { loggedInUserId: 'usr_111111111111111111111111' },
    );
    expect(trashResponse.status).toBe(200);

    // Public access to both the metadata and the file must stop with a 410 Gone.
    const trashedDocumentResponse = await app.request(`/api/share-links/${shareLink.token}/document`);
    expect(trashedDocumentResponse.status).toBe(410);
    expect(await trashedDocumentResponse.json()).toMatchObject({ error: { code: 'share_link.gone' } });

    const trashedFileResponse = await app.request(`/api/share-links/${shareLink.token}/document/file`);
    expect(trashedFileResponse.status).toBe(410);
    expect(await trashedFileResponse.json()).toMatchObject({ error: { code: 'share_link.gone' } });

    // Restoring the document brings the same link back to life.
    const restoreResponse = await app.request(
      '/api/organizations/org_222222222222222222222222/documents/doc_333333333333333333333333/restore',
      { method: 'POST' },
      { loggedInUserId: 'usr_111111111111111111111111' },
    );
    expect(restoreResponse.status).toBe(204);

    const restoredDocumentResponse = await app.request(`/api/share-links/${shareLink.token}/document`);
    expect(restoredDocumentResponse.status).toBe(200);
    expect(await restoredDocumentResponse.json()).toEqual({
      document: { name: 'invoice.pdf', size: 1024, mimeType: 'application/pdf' },
    });

    const restoredFileResponse = await app.request(`/api/share-links/${shareLink.token}/document/file`);
    expect(restoredFileResponse.status).toBe(200);
    expect(await restoredFileResponse.text()).toBe('File content.');
  });
});
