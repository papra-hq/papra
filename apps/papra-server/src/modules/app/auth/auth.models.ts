import type { ApiKey, ApiKeyPermissions } from '../../api-keys/api-keys.types';
import type { Config } from '../../config/config.types';
import type { Context } from '../server.types';
import type { Session } from './auth.types';
import { uniq } from 'lodash-es';
import { createError } from '../../shared/errors/errors';

export function getUser({ context }: { context: Context }) {
  const userId = context.get('userId');

  if (!userId) {
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
  const { baseUrl } = config.client;
  const { trustedOrigins } = config.server;

  return {
    trustedOrigins: uniq([baseUrl, ...trustedOrigins]),
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

    const atLeastOnePermissionMatches = apiKey.permissions.some(permission => requiredApiKeyPermissions.includes(permission));

    return atLeastOnePermissionMatches;
  }

  if (authType === 'session' && session) {
    return true;
  }

  return false;
}
