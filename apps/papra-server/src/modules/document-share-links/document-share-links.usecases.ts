import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { Clock } from '../shared/clock/clock.types';
import type { ShareLinksRepository } from './document-share-links.repository';
import type { DbSelectableShareLink } from './document-share-links.types';
import { getDocumentOrThrow } from '../documents/documents.usecases';
import { systemClock } from '../shared/clock/clock';
import { isNil } from '../shared/utils';
import { isShareLinkAccessTokenValid, issueShareLinkAccessToken } from './document-share-links.access-token';
import {
  createShareLinkGoneError,
  createShareLinkInvalidPasswordError,
  createShareLinkLimitReachedError,
  createShareLinkNotFoundError,
  createShareLinkNotPasswordProtectedError,
  createShareLinkPasswordRequiredError,
} from './document-share-links.errors';
import { generateShareToken } from './document-share-links.models';
import { hashPassword, verifyPassword } from './document-share-links.password';

function isShareLinkExpired({ shareLink, clock }: { shareLink: DbSelectableShareLink; clock: Clock }) {
  if (isNil(shareLink.expiresAt)) {
    return false;
  }

  return shareLink.expiresAt.getTime() <= clock.now().epochMilliseconds;
}

async function resolvePasswordHash({ password}: { password: string | undefined | null }) {
  if (password === undefined) {
    return { passwordHash: undefined };
  }

  // null explicitly removes the password in updates
  if (password === null) {
    return { passwordHash: null };
  }

  const { passwordHash } = await hashPassword({ password });
  return { passwordHash };
}

export async function createShareLink({
  organizationId,
  documentId,
  expiresAt,
  password,
  userId,
  shareLinksRepository,
  documentsRepository,
  config,
}: {
  organizationId: string;
  documentId: string;
  expiresAt?: Date | null;
  password?: string;
  userId: string;
  shareLinksRepository: ShareLinksRepository;
  documentsRepository: DocumentsRepository;
  config: Config;
}) {
  // Ensures the document exists in the organization before exposing it through a share link.
  await getDocumentOrThrow({ documentId, organizationId, documentsRepository });

  const { shareLinksCount } = await shareLinksRepository.countDocumentShareLinks({ documentId, organizationId });

  if (shareLinksCount >= config.documentShareLinks.maxLinksPerDocument) {
    throw createShareLinkLimitReachedError();
  }

  const { token } = generateShareToken();
  const { passwordHash } = await resolvePasswordHash({ password });

  const { shareLink } = await shareLinksRepository.createShareLink({
    organizationId,
    documentId,
    token,
    expiresAt,
    passwordHash,
    createdBy: userId,
  });

  return { shareLink };
}

export async function updateShareLink({
  shareLinkId,
  organizationId,
  expiresAt,
  password,
  isEnabled,
  shareLinksRepository,
}: {
  shareLinkId: string;
  organizationId: string;
  expiresAt?: Date | null;
  password?: string | null;
  isEnabled?: boolean;
  shareLinksRepository: ShareLinksRepository;
}) {
  const { passwordHash } = await resolvePasswordHash({ password });

  const { shareLink } = await shareLinksRepository.updateShareLink({
    shareLinkId,
    organizationId,
    expiresAt,
    passwordHash,
    isEnabled,
  });

  return { shareLink };
}

// Resolves a share link by its public token, throwing 404 if unknown and 410 if disabled/expired.
export async function resolveUsableShareLinkByToken({
  token,
  shareLinksRepository,
  clock = systemClock,
}: {
  token: string;
  shareLinksRepository: ShareLinksRepository;
  clock?: Clock;
}) {
  const { shareLink } = await shareLinksRepository.getShareLinkByToken({ token });

  if (!shareLink) {
    throw createShareLinkNotFoundError();
  }

  if (!shareLink.isEnabled || isShareLinkExpired({ shareLink, clock })) {
    throw createShareLinkGoneError();
  }

  return { shareLink };
}

// Throws 401 when the link is password protected and no valid access token was provided.
export async function ensureShareLinkAccessGranted({
  shareLink,
  accessToken,
  config,
  clock = systemClock,
}: {
  shareLink: DbSelectableShareLink;
  accessToken: string | undefined;
  config: Config;
  clock?: Clock;
}) {
  if (shareLink.passwordHash === null) {
    return;
  }

  const { isValid } = await isShareLinkAccessTokenValid({ accessToken, shareLinkId: shareLink.id, authSecret: config.auth.secret, clock });

  if (!isValid) {
    throw createShareLinkPasswordRequiredError();
  }
}

export async function verifySharePassword({
  token,
  password,
  shareLinksRepository,
  config,
  clock = systemClock,
}: {
  token: string;
  password: string;
  shareLinksRepository: ShareLinksRepository;
  config: Config;
  clock?: Clock;
}) {
  const { shareLink } = await resolveUsableShareLinkByToken({ token, shareLinksRepository, clock });

  if (shareLink.passwordHash === null) {
    throw createShareLinkNotPasswordProtectedError();
  }

  const { isValid } = await verifyPassword({ password, passwordHash: shareLink.passwordHash });

  if (!isValid) {
    throw createShareLinkInvalidPasswordError();
  }

  const { accessToken } = await issueShareLinkAccessToken({
    shareLinkId: shareLink.id,
    authSecret: config.auth.secret,
    ttlMinutes: config.documentShareLinks.accessTokenTtlMinutes,
    clock,
  });

  return { accessToken };
}

// Resolves a share link for public document access: validates usability, enforces password, returns the document.
export async function getSharedDocument({
  token,
  accessToken,
  shareLinksRepository,
  documentsRepository,
  config,
  clock = systemClock,
}: {
  token: string;
  accessToken: string | undefined;
  shareLinksRepository: ShareLinksRepository;
  documentsRepository: DocumentsRepository;
  config: Config;
  clock?: Clock;
}) {
  const { shareLink } = await resolveUsableShareLinkByToken({ token, shareLinksRepository, clock });

  await ensureShareLinkAccessGranted({ shareLink, accessToken, config, clock });

  const { document } = await getDocumentOrThrow({ documentId: shareLink.documentId, organizationId: shareLink.organizationId, documentsRepository });

  await shareLinksRepository.touchLastAccessedAt({ shareLinkId: shareLink.id, lastAccessedAt: new Date(clock.now().epochMilliseconds) });

  return { shareLink, document };
}
