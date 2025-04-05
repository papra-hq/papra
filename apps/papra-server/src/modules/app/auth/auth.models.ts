import type { Config } from '../../config/config.types';
import type { Context } from '../server.types';
import { uniq } from 'lodash-es';
import { createError } from '../../shared/errors/errors';

export function getUser({ context }: { context: Context }) {
  const user = context.get('user');

  if (!user) {
    throw createError({
      message: 'User not found in context',
      code: 'users.not_found',
      statusCode: 403,
      isInternal: true,
    });
  }

  return {
    user,
    userId: user.id,
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
    trustedOrigins: trustedOrigins === '*' ? undefined : uniq([baseUrl, ...trustedOrigins]),
  };
}
