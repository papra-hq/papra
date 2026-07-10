import { eq } from 'drizzle-orm';
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
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { organizationsTable } from '../organizations/organizations.table';

const config = overrideConfig({ auth: { secret: 'test-secret-that-is-at-least-32-chars-long' } });

async function setup({ now = '2026-05-12T00:00:00Z' }: { now?: string } = {}) {
  const { clock } = createTestClock({ now });
  const { db } = await createInMemoryDatabase({
    users: [{ id: 'user_1', email: 'test@test.com' }],
    organizations: [{ id: 'org_1', name: 'Org 1' }],
    documents: [
      {
        id: 'doc_1',
        organizationId: 'org_1',
        name: 'invoice.pdf',
        originalName: 'invoice.pdf',
        originalSize: 1024,
        originalStorageKey: 'org_1/originals/doc_1.pdf',
        originalSha256Hash: 'hash_1',
        mimeType: 'application/pdf',
      },
    ],
  });

  const shareLinksRepository = createShareLinksRepository({ db });
  const documentsRepository = createDocumentsRepository({ db });
  const organizationsRepository = createOrganizationsRepository({ db });

  return { clock, db, shareLinksRepository, documentsRepository, organizationsRepository };
}

describe('document-share-links usecases', () => {
  describe('createShareLink', () => {
    test('stores the provided expiration date and a 64-char token', async () => {
      const { shareLinksRepository, documentsRepository } = await setup({
        now: '2026-05-12T00:00:00Z',
      });

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        expiresAt: new Date('2026-05-19T00:00:00Z'),
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      expect(shareLink.expiresAt).to.eql(new Date('2026-05-19T00:00:00Z'));
      expect(shareLink.passwordHash).to.eql(null);
      expect(shareLink.token).to.have.length(64);
    });

    test('an omitted/null expiration creates a link that never expires', async () => {
      const { shareLinksRepository, documentsRepository } = await setup();

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        expiresAt: null,
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      expect(shareLink.expiresAt).to.eql(null);
    });

    test('the password is hashed and never stored in plain text', async () => {
      const { shareLinksRepository, documentsRepository } = await setup();

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      expect(shareLink.passwordHash).to.be.a('string');
      expect(shareLink.passwordHash).not.to.include('hunter2');
      expect(shareLink.passwordHash!.startsWith('$scrypt$')).to.eql(true);
    });

    test('throws when the document does not exist in the organization', async () => {
      const { shareLinksRepository, documentsRepository } = await setup();

      await expect(
        createShareLink({
          organizationId: 'org_1',
          documentId: 'doc_unknown',
          userId: 'user_1',
          shareLinksRepository,
          documentsRepository,
          config,
        }),
      ).rejects.toThrowError('Document not found.');
    });

    test('enforces the maximum number of share links per document', async () => {
      const limitedConfig = overrideConfig({
        auth: { secret: config.auth.secret },
        documentShareLinks: { maxLinksPerDocument: 2 },
      });
      const { shareLinksRepository, documentsRepository } = await setup();

      const create = async () =>
        createShareLink({
          organizationId: 'org_1',
          documentId: 'doc_1',
          userId: 'user_1',
          shareLinksRepository,
          documentsRepository,
          config: limitedConfig,
        });

      await create();
      await create();

      await expect(create()).rejects.toThrowError('maximum number of share links');
    });
  });

  describe('resolveUsableShareLinkByToken', () => {
    test('throws 404 when the token is unknown', async () => {
      const { clock, shareLinksRepository, organizationsRepository } = await setup();

      await expect(
        resolveUsableShareLinkByToken({
          shareLinkToken: 'unknown',
          shareLinksRepository,
          organizationsRepository,
          clock,
        }),
      ).rejects.toThrowError('Share link not found.');
    });

    test('throws 410 when the link is disabled', async () => {
      const { clock, db, shareLinksRepository, organizationsRepository } = await setup();
      await db.insert(documentShareLinksTable).values({
        id: 'dsl_1',
        organizationId: 'org_1',
        documentId: 'doc_1',
        token: 't'.repeat(64),
        isEnabled: false,
      });

      await expect(
        resolveUsableShareLinkByToken({
          shareLinkToken: 't'.repeat(64),
          shareLinksRepository,
          organizationsRepository,
          clock,
        }),
      ).rejects.toThrowError('no longer available');
    });

    test('throws 410 when the link is expired', async () => {
      const { clock, db, shareLinksRepository, organizationsRepository } = await setup({
        now: '2026-05-20T00:00:00Z',
      });
      await db.insert(documentShareLinksTable).values({
        id: 'dsl_1',
        organizationId: 'org_1',
        documentId: 'doc_1',
        token: 't'.repeat(64),
        expiresAt: new Date('2026-05-19T00:00:00Z'),
      });

      await expect(
        resolveUsableShareLinkByToken({
          shareLinkToken: 't'.repeat(64),
          shareLinksRepository,
          organizationsRepository,
          clock,
        }),
      ).rejects.toThrowError('no longer available');
    });

    test('throws 410 when the organization is soft-deleted', async () => {
      const { clock, db, shareLinksRepository, organizationsRepository } = await setup();
      await db.insert(documentShareLinksTable).values({
        id: 'dsl_1',
        organizationId: 'org_1',
        documentId: 'doc_1',
        token: 't'.repeat(64),
      });
      await db
        .update(organizationsTable)
        .set({ deletedAt: new Date('2026-05-11T00:00:00Z') })
        .where(eq(organizationsTable.id, 'org_1'));

      await expect(
        resolveUsableShareLinkByToken({
          shareLinkToken: 't'.repeat(64),
          shareLinksRepository,
          organizationsRepository,
          clock,
        }),
      ).rejects.toThrowError('no longer available');
    });
  });

  describe('verifySharePassword + ensureShareLinkAccessGranted', () => {
    test('a correct password yields an access token that grants access to the document', async () => {
      const { clock, shareLinksRepository, documentsRepository, organizationsRepository } =
        await setup();

      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      const { accessToken } = await verifySharePassword({
        shareLinkToken: shareLink.token,
        password: 'hunter2',
        shareLinksRepository,
        organizationsRepository,
        config,
        clock,
      });

      // Granting access with the freshly issued token resolves without throwing.
      await ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock });
    });

    test('an incorrect password is rejected', async () => {
      const { clock, shareLinksRepository, documentsRepository, organizationsRepository } =
        await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      await expect(
        verifySharePassword({
          shareLinkToken: shareLink.token,
          password: 'wrong',
          shareLinksRepository,
          organizationsRepository,
          config,
          clock,
        }),
      ).rejects.toThrowError('Invalid password.');
    });

    test('verifying a password on a non-protected link throws', async () => {
      const { clock, shareLinksRepository, documentsRepository, organizationsRepository } =
        await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      await expect(
        verifySharePassword({
          shareLinkToken: shareLink.token,
          password: 'whatever',
          shareLinksRepository,
          organizationsRepository,
          config,
          clock,
        }),
      ).rejects.toThrowError('not password protected');
    });

    test('access is denied without a token on a protected link', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      await expect(
        ensureShareLinkAccessGranted({ shareLink, accessToken: undefined, config, clock }),
      ).rejects.toThrowError('valid access token is required');
    });

    test('an expired access token is rejected', async () => {
      const { clock, shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      const { accessToken } = await issueShareLinkAccessToken({
        shareLinkId: shareLink.id,
        passwordHash: shareLink.passwordHash!,
        authSecret: config.auth.secret,
        ttlMinutes: 15,
        clock,
      });

      // Move past the token TTL.
      clock.advanceBy({ minutes: 16 });

      await expect(
        ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock }),
      ).rejects.toThrowError('valid access token is required');
    });

    test('rotating the password invalidates previously issued access tokens', async () => {
      const { clock, shareLinksRepository, documentsRepository, organizationsRepository } =
        await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      const { accessToken } = await verifySharePassword({
        shareLinkToken: shareLink.token,
        password: 'hunter2',
        shareLinksRepository,
        organizationsRepository,
        config,
        clock,
      });

      // Token is valid against the current password.
      await ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock });

      const { shareLink: rotated } = await updateShareLink({
        shareLinkId: shareLink.id,
        organizationId: 'org_1',
        password: 'new-password',
        shareLinksRepository,
      });

      // The same token no longer grants access once the password changed.
      await expect(
        ensureShareLinkAccessGranted({ shareLink: rotated, accessToken, config, clock }),
      ).rejects.toThrowError('valid access token is required');
    });
  });

  describe('getSharedDocument', () => {
    test('returns the document for a non-protected, usable link and records the access time', async () => {
      const { clock, shareLinksRepository, documentsRepository, organizationsRepository } =
        await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      const { document } = await getSharedDocument({
        shareLinkToken: shareLink.token,
        accessToken: undefined,
        shareLinksRepository,
        documentsRepository,
        organizationsRepository,
        config,
        clock,
      });

      expect(document.id).to.eql('doc_1');

      const { shareLink: refreshed } = await shareLinksRepository.getShareLinkById({
        shareLinkId: shareLink.id,
        organizationId: 'org_1',
      });
      expect(refreshed?.lastAccessedAt).to.eql(new Date('2026-05-12T00:00:00Z'));
    });
  });

  describe('updateShareLink', () => {
    test('setting password to null removes protection', async () => {
      const { shareLinksRepository, documentsRepository } = await setup();
      const { shareLink } = await createShareLink({
        organizationId: 'org_1',
        documentId: 'doc_1',
        password: 'hunter2',
        userId: 'user_1',
        shareLinksRepository,
        documentsRepository,
        config,
      });

      const { shareLink: updated } = await updateShareLink({
        shareLinkId: shareLink.id,
        organizationId: 'org_1',
        password: null,
        shareLinksRepository,
      });

      expect(updated.passwordHash).to.eql(null);
    });
  });
});
