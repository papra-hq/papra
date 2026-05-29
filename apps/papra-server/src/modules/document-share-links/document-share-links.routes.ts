import type { RateLimitKvStore } from '../app/rate-limit/rate-limit.types';
import type { Context, RouteDefinitionContext } from '../app/server.types';
import { Readable } from 'node:stream';
import * as v from 'valibot';
import { requireAuthentication } from '../app/auth/auth.middleware';
import { getUser } from '../app/auth/auth.models';
import { checkRateLimit } from '../app/rate-limit/rate-limit.usecases';
import { createDocumentsRepository } from '../documents/documents.repository';
import { documentIdSchema } from '../documents/documents.schemas';
import { getDocumentOrThrow } from '../documents/documents.usecases';
import { organizationIdSchema } from '../organizations/organization.schemas';
import { createOrganizationsRepository } from '../organizations/organizations.repository';
import { ensureUserIsInOrganization } from '../organizations/organizations.usecases';
import { validateJsonBody, validateParams } from '../shared/validation/validation';
import { formatPublicSharedDocument, formatShareLinkForApi, formatShareLinksForApi } from './document-share-links.models';
import { createShareLinksRepository } from './document-share-links.repository';
import { createShareLinkBodySchema, shareLinkIdSchema, shareLinkTokenSchema, updateShareLinkBodySchema, verifySharePasswordBodySchema } from './document-share-links.schemas';
import {
  createShareLink,
  ensureShareLinkAccessGranted,
  getSharedDocument,
  resolveUsableShareLinkByToken,
  updateShareLink,
  verifySharePassword,
} from './document-share-links.usecases';

export function registerDocumentShareLinksRoutes(context: RouteDefinitionContext) {
  // Organization-scoped management endpoints (authenticated)
  setupCreateShareLinkRoute(context);
  setupGetDocumentShareLinksRoute(context);
  setupGetOrganizationShareLinksRoute(context);
  setupUpdateShareLinkRoute(context);
  setupDeleteShareLinkRoute(context);

  // Public endpoints (no authentication)
  setupGetSharedDocumentRoute(context);
  setupVerifySharePasswordRoute(context);
  setupGetSharedDocumentFileRoute(context);
}

// The visitor's access token (issued after password verification) can be sent either as a Bearer header or, for direct file links, a query param.
function getAccessToken({ context }: { context: Context }) {
  const authorization = context.req.header('Authorization');

  if (authorization !== undefined && authorization.startsWith('Bearer ')) {
    return { accessToken: authorization.slice('Bearer '.length) };
  }

  return { accessToken: context.req.query('accessToken') };
}

function setupCreateShareLinkRoute({ app, db, config }: RouteDefinitionContext) {
  app.post(
    '/api/organizations/:organizationId/documents/:documentId/share-links',
    requireAuthentication({ apiKeyPermissions: ['documents:update'] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, documentId: documentIdSchema })),
    validateJsonBody(createShareLinkBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId } = context.req.valid('param');
      const { expiresAt, password } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const shareLinksRepository = createShareLinksRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { shareLink } = await createShareLink({
        organizationId,
        documentId,
        expiresAt,
        password,
        userId,
        shareLinksRepository,
        documentsRepository,
        config,
      });

      return context.json({ shareLink: formatShareLinkForApi({ shareLink, config }) }, 201);
    },
  );
}

function setupGetDocumentShareLinksRoute({ app, db, config }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/documents/:documentId/share-links',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, documentId: documentIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, documentId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const documentsRepository = createDocumentsRepository({ db });
      await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

      const shareLinksRepository = createShareLinksRepository({ db });
      const { shareLinks } = await shareLinksRepository.getDocumentShareLinks({ documentId, organizationId });

      return context.json({ shareLinks: formatShareLinksForApi({ shareLinks, config }) });
    },
  );
}

function setupGetOrganizationShareLinksRoute({ app, db, config }: RouteDefinitionContext) {
  app.get(
    '/api/organizations/:organizationId/share-links',
    requireAuthentication({ apiKeyPermissions: ['documents:read'] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const shareLinksRepository = createShareLinksRepository({ db });
      const { shareLinks } = await shareLinksRepository.getOrganizationShareLinks({ organizationId });

      return context.json({ shareLinks: formatShareLinksForApi({ shareLinks, config }) });
    },
  );
}

function setupUpdateShareLinkRoute({ app, db, config }: RouteDefinitionContext) {
  app.patch(
    '/api/organizations/:organizationId/share-links/:shareLinkId',
    requireAuthentication({ apiKeyPermissions: ['documents:update'] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, shareLinkId: shareLinkIdSchema })),
    validateJsonBody(updateShareLinkBodySchema),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, shareLinkId } = context.req.valid('param');
      const { expiresAt, password, isEnabled } = context.req.valid('json');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const shareLinksRepository = createShareLinksRepository({ db });
      const { shareLink } = await updateShareLink({ shareLinkId, organizationId, expiresAt, password, isEnabled, shareLinksRepository });

      return context.json({ shareLink: formatShareLinkForApi({ shareLink, config }) });
    },
  );
}

function setupDeleteShareLinkRoute({ app, db }: RouteDefinitionContext) {
  app.delete(
    '/api/organizations/:organizationId/share-links/:shareLinkId',
    requireAuthentication({ apiKeyPermissions: ['documents:update'] }),
    validateParams(v.strictObject({ organizationId: organizationIdSchema, shareLinkId: shareLinkIdSchema })),
    async (context) => {
      const { userId } = getUser({ context });
      const { organizationId, shareLinkId } = context.req.valid('param');

      const organizationsRepository = createOrganizationsRepository({ db });
      await ensureUserIsInOrganization({ userId, organizationId, organizationsRepository });

      const shareLinksRepository = createShareLinksRepository({ db });
      await shareLinksRepository.deleteShareLink({ shareLinkId, organizationId });

      return context.body(null, 204);
    },
  );
}

function setupGetSharedDocumentRoute({ app, db, config }: RouteDefinitionContext) {
  app.get(
    '/api/share-links/:token/document',
    validateParams(v.strictObject({ token: shareLinkTokenSchema })),
    async (context) => {
      const { token } = context.req.valid('param');
      const { accessToken } = getAccessToken({ context });

      const shareLinksRepository = createShareLinksRepository({ db });
      const documentsRepository = createDocumentsRepository({ db });

      const { document } = await getSharedDocument({ token, accessToken, shareLinksRepository, documentsRepository, config });

      return context.json({ document: formatPublicSharedDocument({ document }) });
    },
  );
}

function setupVerifySharePasswordRoute({ app, db, config, kvStore }: RouteDefinitionContext) {
  const rateLimitScope: RateLimitKvStore = kvStore.defineScope({
    prefix: 'share-link-password-verify',
    schema: v.object({ hitCount: v.number(), resetAtEpochMs: v.number() }),
  });

  app.post(
    '/api/share-links/:token/verify',
    validateParams(v.strictObject({ token: shareLinkTokenSchema })),
    validateJsonBody(verifySharePasswordBodySchema),
    async (context) => {
      const { token } = context.req.valid('param');
      const { password } = context.req.valid('json');

      // Strong rate limit per token to prevent brute-forcing the password.
      await checkRateLimit({
        maxHits: config.documentShareLinks.passwordVerifyMaxAttempts,
        window: { minutes: config.documentShareLinks.passwordVerifyWindowMinutes },
        key: token,
        kvStore: rateLimitScope,
      });

      const shareLinksRepository = createShareLinksRepository({ db });
      const { accessToken } = await verifySharePassword({ token, password, shareLinksRepository, config });

      return context.json({ accessToken });
    },
  );
}

function setupGetSharedDocumentFileRoute({ app, db, config, documentsStorageService, kvStore }: RouteDefinitionContext) {
  const rateLimitScope: RateLimitKvStore = kvStore.defineScope({
    prefix: 'share-link-file-access',
    schema: v.object({ hitCount: v.number(), resetAtEpochMs: v.number() }),
  });

  app.get(
    '/api/share-links/:token/document/file',
    validateParams(v.strictObject({ token: shareLinkTokenSchema })),
    async (context) => {
      const { token } = context.req.valid('param');
      const { accessToken } = getAccessToken({ context });

      // Prevent abuse of the share system as a file host.
      await checkRateLimit({
        maxHits: config.documentShareLinks.fileAccessMaxRequestsPerMinute,
        window: { minutes: 1 },
        key: token,
        kvStore: rateLimitScope,
      });

      const shareLinksRepository = createShareLinksRepository({ db });
      const { shareLink } = await resolveUsableShareLinkByToken({ token, shareLinksRepository });

      await ensureShareLinkAccessGranted({ shareLink, accessToken, config });

      const documentsRepository = createDocumentsRepository({ db });
      const { document } = await getDocumentOrThrow({ documentId: shareLink.documentId, organizationId: shareLink.organizationId, documentsRepository });

      const { fileStream } = await documentsStorageService.getFileStream({
        storageKey: document.originalStorageKey,
        fileEncryptionAlgorithm: document.fileEncryptionAlgorithm,
        fileEncryptionKekVersion: document.fileEncryptionKekVersion,
        fileEncryptionKeyWrapped: document.fileEncryptionKeyWrapped,
      });

      await shareLinksRepository.touchLastAccessedAt({ shareLinkId: shareLink.id, lastAccessedAt: new Date() });

      return context.body(
        Readable.toWeb(fileStream),
        200,
        {
          // Serve as an opaque attachment to prevent the browser from rendering potentially dangerous files.
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
          'Content-Length': String(document.originalSize),
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      );
    },
  );
}
