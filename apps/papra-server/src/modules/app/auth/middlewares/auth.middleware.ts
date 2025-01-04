import type { ServerInstanceGenerics } from '../../server.types';
import { createMiddleware } from 'hono/factory';
import { getConfig } from '../../../config/config.models';
import { getAuthorizationHeader } from '../../../shared/headers/headers.models';
import { createCookieRepository } from '../../cookies/cookies.repository';
import { createUnauthorizedError } from '../auth.errors';
import { verifyJwt } from '../auth.services';
import { createRefreshTokenCookieRepository } from '../refresh-tokens/refresh-token.cookie.repository';

export const jwtValidationMiddleware = createMiddleware<ServerInstanceGenerics>(async (context, next) => {
  const { authorizationHeader } = getAuthorizationHeader({ context });
  const { config } = getConfig({ context });

  const { deleteRefreshTokenCookie } = createRefreshTokenCookieRepository({ config, cookiesRepository: createCookieRepository({ context }) });

  if (!authorizationHeader) {
    throw createUnauthorizedError();
  }

  const tokenParts = authorizationHeader.trim().split(' ');

  if (tokenParts.length !== 2) {
    throw createUnauthorizedError();
  }

  const token = tokenParts[1];

  const {
    auth: { jwtSecret },
  } = config;

  try {
    const jwtPayload = await verifyJwt({ token, jwtSecret });

    context.set('jwtPayload', jwtPayload);

    await next();
  } catch (_ignored) {
    await deleteRefreshTokenCookie();

    throw createUnauthorizedError();
  }
});
