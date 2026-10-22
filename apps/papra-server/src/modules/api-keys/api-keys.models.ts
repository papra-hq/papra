import { createUnauthorizedError } from '../app/auth/auth.errors';
import { sha256 } from '../shared/crypto/hash';
import { isNil } from '../shared/utils';
import { API_KEY_PREFIX, API_KEY_TOKEN_REGEX } from './api-keys.constants';

export function getApiKeyUiPrefix({ token }: { token: string }) {
  return {
    prefix: token.slice(0, 5 + API_KEY_PREFIX.length + 1),
  };
}

export function getApiKeyHash({ token }: { token: string }) {
  return {
    keyHash: sha256(token, { digest: 'base64url' }),
  };
}

export function extractApiKeyToken({ headers }: { headers: Headers }): string | undefined {
  const authorizationHeader = headers.get('Authorization');

  if (authorizationHeader === null) {
    return undefined;
  }

  const parts = authorizationHeader.split(' ');
  const [scheme, token] = parts;

  if (parts.length !== 2 || scheme !== 'Bearer') {
    throw createUnauthorizedError();
  }

  // Other bearer tokens (such as share-link JWTs) belong to downstream handlers.
  return looksLikeAnApiKey(token) ? token : undefined;
}

// Positional argument as TS does not like named argument with type guards
export function looksLikeAnApiKey(token?: string | null): token is string {
  if (isNil(token)) {
    return false;
  }

  return API_KEY_TOKEN_REGEX.test(token);
}
