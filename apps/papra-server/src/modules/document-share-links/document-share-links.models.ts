import type { Config } from '../config/config.types';
import type { DbSelectableShareLink } from './document-share-links.types';
import { buildUrl } from '@corentinth/chisels';
import { getClientBaseUrl } from '../config/config.models';
import { omit } from '../shared/objects';
import { generateId } from '../shared/random/ids';
import { generateRandomString } from '../shared/random/random.services';
import { SHARE_LINK_ID_PREFIX, SHARE_LINK_TOKEN_LENGTH } from './document-share-links.constants';

export function generateShareLinkId() {
  return generateId({ prefix: SHARE_LINK_ID_PREFIX });
}

export function generateShareToken() {
  return { token: generateRandomString({ length: SHARE_LINK_TOKEN_LENGTH }) };
}

export function buildShareLinkUrl({ token, config }: { token: string; config: Config }) {
  const { clientBaseUrl } = getClientBaseUrl({ config });

  return { url: buildUrl({ baseUrl: clientBaseUrl, path: `/share/${token}` }) };
}

export function formatShareLinkForApi({ shareLink, config }: { shareLink: DbSelectableShareLink; config: Config }) {
  const { url } = buildShareLinkUrl({ token: shareLink.token, config });

  return {
    ...omit(shareLink, ['passwordHash']),
    isPasswordProtected: shareLink.passwordHash !== null,
    url,
  };
}

export function formatShareLinksForApi({ shareLinks, config }: { shareLinks: DbSelectableShareLink[]; config: Config }) {
  return shareLinks.map(shareLink => formatShareLinkForApi({ shareLink, config }));
}

// Public-facing document details, exposing only what an anonymous visitor is allowed to see.
export function formatPublicSharedDocument({ document }: { document: { name: string; originalSize: number; mimeType: string } }) {
  return {
    name: document.name,
    size: document.originalSize,
    mimeType: document.mimeType,
  };
}
