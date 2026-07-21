import type { Config } from '../config/config.types';
import type { Clock } from '../shared/clock/clock.types';
import type { DbSelectableShareLink } from './document-share-links.types';
import { buildUrl } from '@corentinth/chisels';
import { getClientBaseUrl } from '../config/config.models';
import { omit } from '../shared/objects';
import { generateId } from '../shared/random/ids';
import { generateRandomString } from '../shared/random/random.services';
import { isNil } from '../shared/utils';
import {
  SHARE_LINK_ID_PREFIX,
  SHARE_LINK_LAST_ACCESSED_TOUCH_DELAY_SECONDS,
  SHARE_LINK_TOKEN_LENGTH,
} from './document-share-links.constants';

export function generateShareLinkId() {
  return generateId({ prefix: SHARE_LINK_ID_PREFIX });
}

export function generateShareToken() {
  return { token: generateRandomString({ length: SHARE_LINK_TOKEN_LENGTH }) };
}

export function getShareLinkBaseUrl({ config }: { config: Config }) {
  const { shareLinkBaseUrl } = config.documentShareLinks;

  if (!isNil(shareLinkBaseUrl)) {
    return { shareLinkBaseUrl };
  }

  const { clientBaseUrl } = getClientBaseUrl({ config });

  return { shareLinkBaseUrl: clientBaseUrl };
}

export function buildShareLinkUrl({ token, config }: { token: string; config: Config }) {
  const { shareLinkBaseUrl } = getShareLinkBaseUrl({ config });

  return { url: buildUrl({ baseUrl: shareLinkBaseUrl, path: `/share/${token}` }) };
}

export function formatShareLinkForApi({
  shareLink,
  config,
}: {
  shareLink: DbSelectableShareLink;
  config: Config;
}) {
  const { url } = buildShareLinkUrl({ token: shareLink.token, config });

  return {
    ...omit(shareLink, ['passwordHash']),
    isPasswordProtected: !isNil(shareLink.passwordHash),
    url,
  };
}

export function formatShareLinksForApi({
  shareLinks,
  config,
}: {
  shareLinks: DbSelectableShareLink[];
  config: Config;
}) {
  return shareLinks.map((shareLink) => formatShareLinkForApi({ shareLink, config }));
}

// Public-facing document details, exposing only what an anonymous visitor is allowed to see.
export function formatPublicSharedDocument({
  document,
}: {
  document: { name: string; originalSize: number; mimeType: string };
}) {
  return {
    name: document.name,
    size: document.originalSize,
    mimeType: document.mimeType,
  };
}

export function shouldTouchShareLinkLastAccessedAt({
  lastAccessedAt,
  clock,
}: {
  lastAccessedAt: null | undefined | Temporal.Instant;
  clock: Clock;
}) {
  if (isNil(lastAccessedAt)) {
    return true;
  }

  return (
    clock.now().since(lastAccessedAt).total('second') > SHARE_LINK_LAST_ACCESSED_TOUCH_DELAY_SECONDS
  );
}
