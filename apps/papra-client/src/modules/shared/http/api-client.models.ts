import type { FetchError } from 'ofetch';
import { getErrorStatus } from '../utils/errors';

export function shouldRefreshAuthTokens({ error }: { error: FetchError | unknown | undefined }) {
  if (!error) {
    return false;
  }

  return getErrorStatus(error) === 401;
}

export function buildAuthHeader({ accessToken }: { accessToken?: string | null | undefined } = {}): Record<string, string> {
  if (!accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}
