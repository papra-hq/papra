import { sha256 } from '../shared/crypto/hash';
import { API_KEY_PREFIX } from './api-keys.constants';

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
