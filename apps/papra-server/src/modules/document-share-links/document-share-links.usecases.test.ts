import { describe, expect, test } from 'vitest';
import { createInMemoryDatabase } from '../app/database/database.test-utils';
import { overrideConfig } from '../config/config.test-utils';
import { createDocumentsRepository } from '../documents/documents.repository';
import { createTestClock } from '../shared/clock/clock.test-utils';
import { issueShareLinkAccessToken } from './document-share-links.access-token';
import { createShareLinksRepository } from './document-share-links.repository';
import { documentShareLinksTable } from './document-share-links.table';
import {
  createShareLink,
  ensureShareLinkAccessGranted,
  getSharedDocument,
  resolveUsableShareLinkByToken,
  updateShareLink,
  verifySharePassword,
} from './document-share-links.usecases';

const config = overrideConfig({ auth: { secret: 'test-secret-that-is-at-least-32-chars-long' } });

async function setup({ now = '2026-05-12T00:00:00Z' }: { now?: string } = {}) {
  const { clock } = createTestClock({ now });
  const { db } = await createInMemoryDatabase({
    users: [{ id: 'user_1', email: 'test@test.com' }],
    organizations: [{ id: 'org_1', name: 'Org 1' }],
    documents: [{
      id: 'doc_1',
      organizationId: 'org_1',
      name: 'invoice.pdf',
      originalName: 'invoice.pdf',
      originalSize: 1024,
      originalStorageKey: 'org_1/originals/doc_1.pdf',
      originalSha256Hash: 'hash_1',
      mimeType: 'application/pdf',
    }],
  });

  const shareLinksRepository = createShareLinksRepository({ db });
  const documentsRepository = createDocumentsRepository({ db });

  return { clock, db, shareLinksRepository, documentsRepository };
}

describe('document-share-links usecases', () => {
  describe('createShareLink', () => {
    test('defaults the expiration to 7 days from creation when none is provided', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup({ now: '2026-05-12T00:00:00Z' });

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
        clock,
      });

      expect(shareLink.expiresAt).to.eql(new Date('2026-05-19T00:00:00Z'));
      expect(shareLink.passwordHash).to.eql(null);
      expect(shareLink.token).to.have.length(64);
    });

    test('an explicit null expiration creates a link that never expires', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        expiresAt: null,
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
        clock,
      });

      expect(shareLink.expiresAt).to.eql(null);
    });

    test('the password is hashed and never stored in plain text', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
        clock,
      });

      expect(shareLink.passwordHash).to.be.a('string');
      expect(shareLink.passwordHash).not.to.include('hunter2');
      expect(shareLink.passwordHash!.startsWith('scrypt$')).to.eql(true);
    });

    test('throws when the document does not exist in the organization', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();

      await expect(
        createShareLink({ organizationId: 'org_1', documentId: 'doc_unknown', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock }),
      ).rejects.toThrowError('Document not found.');
    });

    test('enforces the maximum number of share links per document', async () => {
      const limitedConfig = overrideConfig({ auth: { secret: config.auth.secret }, documentShareLinks: { maxLinksPerDocument: 2 } });
      const { clock, shareLinksRepository, documentsRepository } = await setup();

      const create = async () => createShareLink({ organizationId: 'org_1', documentId: 'doc_1', userId: 'user_1', shareLinksRepository, documentsRepository, config: limitedConfig, clock });

      await create();
      await create();

      await expect(create()).rejects.toThrowError('maximum number of share links');
    });
  });

  describe('resolveUsableShareLinkByToken', () => {
    test('throws 404 when the token is unknown', async () => {
      const { clock, shareLinksRepository } = await setup();

      await expect(resolveUsableShareLinkByToken({ token: 'unknown', shareLinksRepository, clock })).rejects.toThrowError('Share link not found.');
    });

    test('throws 410 when the link is disabled', async () => {
      const { clock, db, shareLinksRepository } = await setup();
      await db.insert(documentShareLinksTable).values({ id: 'dsl_1', organizationId: 'org_1', documentId: 'doc_1', token: 't'.repeat(64), isEnabled: false });

      await expect(resolveUsableShareLinkByToken({ token: 't'.repeat(64), shareLinksRepository, clock })).rejects.toThrowError('no longer available');
    });

    test('throws 410 when the link is expired', async () => {
      const { clock, db, shareLinksRepository } = await setup({ now: '2026-05-20T00:00:00Z' });
      await db.insert(documentShareLinksTable).values({ id: 'dsl_1', organizationId: 'org_1', documentId: 'doc_1', token: 't'.repeat(64), expiresAt: new Date('2026-05-19T00:00:00Z') });

      await expect(resolveUsableShareLinkByToken({ token: 't'.repeat(64), shareLinksRepository, clock })).rejects.toThrowError('no longer available');
    });
  });

  describe('verifySharePassword + ensureShareLinkAccessGranted', () => {
    test('a correct password yields an access token that grants access to the document', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();

      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', password: 'hunter2', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      const { accessToken } = await verifySharePassword({ token: shareLink.token, password: 'hunter2', shareLinksRepository, config, clock });

      // Granting access with the freshly issued token resolves without throwing.
      await ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock });
    });

    test('an incorrect password is rejected', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', password: 'hunter2', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      await expect(verifySharePassword({ token: shareLink.token, password: 'wrong', shareLinksRepository, config, clock })).rejects.toThrowError('Invalid password.');
    });

    test('verifying a password on a non-protected link throws', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      await expect(verifySharePassword({ token: shareLink.token, password: 'whatever', shareLinksRepository, config, clock })).rejects.toThrowError('not password protected');
    });

    test('access is denied without a token on a protected link', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', password: 'hunter2', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      await expect(ensureShareLinkAccessGranted({ shareLink, accessToken: undefined, config, clock })).rejects.toThrowError('valid access token is required');
    });

    test('an expired access token is rejected', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', password: 'hunter2', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      const { accessToken } = await issueShareLinkAccessToken({ shareLinkId: shareLink.id, authSecret: config.auth.secret, ttlMinutes: 15, clock });

      // Move past the token TTL.
      clock.advanceBy({ minutes: 16 });

      await expect(ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock })).rejects.toThrowError('valid access token is required');
    });
  });

  describe('getSharedDocument', () => {
    test('returns the document for a non-protected, usable link and records the access time', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      const { document } = await getSharedDocument({ token: shareLink.token, accessToken: undefined, shareLinksRepository, documentsRepository, config, clock });

      expect(document.id).to.eql('doc_1');

      const { shareLink: refreshed } = await shareLinksRepository.getShareLinkById({ shareLinkId: shareLink.id, organizationId: 'org_1' });
      expect(refreshed?.lastAccessedAt).to.eql(new Date('2026-05-12T00:00:00Z'));
    });
  });

  describe('updateShareLink', () => {
    test('setting password to null removes protection', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({ organizationId: 'org_1', documentId: 'doc_1', password: 'hunter2', userId: 'user_1', shareLinksRepository, documentsRepository, config, clock });

      const { shareLink: updated } = await updateShareLink({ shareLinkId: shareLink.id, organizationId: 'org_1', password: null, shareLinksRepository });

      expect(updated.passwordHash).to.eql(null);
    });
  });
});
