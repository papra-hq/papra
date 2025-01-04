import type { Context } from '../server.types';
import { buildUrl } from '@corentinth/chisels';
import { createError } from '../../shared/errors/errors';

export { createAccessTokenRedirectionUrl, getAuthUserId };

function getAuthUserId({ context }: { context: Context }) {
  const userId = context.get('userId');
  const authUserId = context.get('authUserId');

  if (!userId || !authUserId) {
    throw createError({
      message: 'User ID or Auth User ID not found in context',
      code: 'users.id_not_found',
      statusCode: 500,
      isInternal: true,
    });
  }

  return {
    userId,
    authUserId,
  };
}

function createAccessTokenRedirectionUrl({ redirectionBaseUrl, accessToken }: { redirectionBaseUrl: string; accessToken: string }) {
  return buildUrl({
    baseUrl: redirectionBaseUrl,
    hash: `accessToken=${accessToken}`,
  });
}
