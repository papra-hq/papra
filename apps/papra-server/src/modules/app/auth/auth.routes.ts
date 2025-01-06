import type { ServerInstance } from '../server.types';

import { getConfig } from '../../config/config.models';
import { createRolesRepository } from '../../roles/roles.repository';
import { createLogger } from '../../shared/logger/logger';
import { createCookieRepository } from '../cookies/cookies.repository';
import { getDb } from '../database/database.models';
import { createAuthTokensRepository } from './auth-tokens/auth-tokens.repository';
import { renewAuthTokens } from './auth.usecases';
import { registerGithubProviderOauthRoute, registerGoogleProviderOauthRoute } from './oauth-providers/oauth-providers.routes';
import { createRefreshTokenCookieRepository } from './refresh-tokens/refresh-token.cookie.repository';

export function registerAuthPublicRoutes({ app }: { app: ServerInstance }) {
  registerRefreshTokenRoute({ app });
  registerGithubProviderOauthRoute({ app });
  registerGoogleProviderOauthRoute({ app });
}

export function registerAuthPrivateRoutes({ app }: { app: ServerInstance }) {
  registerLogoutRoute({ app });
}

const logger = createLogger({ namespace: 'auth.routes' });

function registerLogoutRoute({ app }: { app: ServerInstance }) {
  app.post('/api/auth/logout', async (context) => {
    const { config } = getConfig({ context });
    const { db } = getDb({ context });
    const refreshTokenCookieRepository = createRefreshTokenCookieRepository({ config, cookiesRepository: createCookieRepository({ context }) });
    const authTokenRepository = createAuthTokensRepository({ db });

    const { refreshToken } = await refreshTokenCookieRepository.getRefreshTokenFromCookie();

    if (refreshToken) {
      await authTokenRepository.deleteAuthToken({ token: refreshToken });
      await refreshTokenCookieRepository.deleteRefreshTokenCookie();
    } else {
      logger.warn('No refresh token found in cookies when trying to logout');
    }

    return context.body(null, 204);
  });
}

function registerRefreshTokenRoute({ app }: { app: ServerInstance }) {
  app.post('/api/auth/refresh', async (context) => {
    const { db } = getDb({ context });
    const { config } = getConfig({ context });

    const authTokensRepository = createAuthTokensRepository({ db });
    const refreshTokenCookieRepository = createRefreshTokenCookieRepository({ config, cookiesRepository: createCookieRepository({ context }) });
    const rolesRepository = createRolesRepository({ db });

    const { accessToken } = await renewAuthTokens({
      authTokensRepository,
      refreshTokenCookieRepository,
      rolesRepository,
      config,
    });

    return context.json({ accessToken });
  });
}
