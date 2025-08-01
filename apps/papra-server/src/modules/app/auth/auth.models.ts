import type { ApiKey, ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Config } from '../../config/config.types';
import type { Context } from '../server.types';
import type { Session } from './auth.types';
import { uniq } from 'lodash-es';
import { getClientBaseUrl } from '../../config/config.models';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';

export function getUser({ context }: { context: Context }) {
  const userId = context.get('userId');

  if (isNil(userId)) {
    // This should never happen as getUser is called in authenticated routes
    // just for proper type safety
    throw createError({
      message: 'User not found in context',
      code: 'users.not_found',
      statusCode: 403,
      isInternal: true,
    });
  }

  return {
    userId,
  };
}

export function getSession({ context }: { context: Context }) {
  const session = context.get('session');

  return { session };
}

export function getTrustedOrigins({ config }: { config: Config }) {
  const { clientBaseUrl } = getClientBaseUrl({ config });
  const { trustedOrigins } = config.server;

  return {
    trustedOrigins: uniq([clientBaseUrl, ...trustedOrigins]),
  };
}

export function isAuthenticationValid({
  session,
  apiKey,
  requiredApiKeyPermissions,
  authType,
}: {
  session?: Session | null | undefined;
  apiKey?: ApiKey | null | undefined;
  requiredApiKeyPermissions?: ApiKeyPermissions[];
  authType: 'api-key' | 'session' | null;
}): boolean {
  if (!authType) {
    return false;
  }

  if (session && authType !== 'session') {
    return false;
  }

  if (apiKey && authType !== 'api-key') {
    return false;
  }

  if (authType === 'api-key') {
    if (!apiKey) {
      return false;
    }

    if (!requiredApiKeyPermissions) {
      return false;
    }

    const allPermissionsMatch = requiredApiKeyPermissions.every(permission => apiKey.permissions.includes(permission));

    return allPermissionsMatch;
  }

  if (authType === 'session' && session) {
    return true;
  }

  return false;
}
