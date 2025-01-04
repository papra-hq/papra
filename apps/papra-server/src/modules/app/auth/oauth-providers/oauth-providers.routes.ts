import type { ServerInstance } from '../../server.types';
import { githubAuth } from '@hono/oauth-providers/github';
import { googleAuth } from '@hono/oauth-providers/google';
import { getConfig } from '../../../config/config.models';
import { createRolesRepository } from '../../../roles/roles.repository';
import { createUsersRepository } from '../../../users/users.repository';
import { createCookieRepository } from '../../cookies/cookies.repository';
import { getDb } from '../../database/database.models';
import { createAuthTokensRepository } from '../auth-tokens/auth-tokens.repository';
import { createUnauthorizedError } from '../auth.errors';
import { createAccessTokenRedirectionUrl } from '../auth.models';
import { createAuthTokens, getOrCreateUserFromProvider } from '../auth.usecases';
import { createRefreshTokenCookieRepository } from '../refresh-tokens/refresh-token.cookie.repository';

export function registerGithubProviderOauthRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/auth/github',
    (context, next) => {
      const { config } = getConfig({ context });
      const { clientId, clientSecret } = config.auth.providers.github;

      const oauthMiddleware = githubAuth({
        oauthApp: true,
        scope: ['read:user', 'user:email'],
        client_id: clientId,
        client_secret: clientSecret,
      });

      return oauthMiddleware(context, next);
    },
    async (context) => {
      const githubUser = context.get('user-github');
      const { db } = getDb({ context });
      const { config } = getConfig({ context });

      const authTokensRepository = createAuthTokensRepository({ db });
      const refreshTokenCookieRepository = createRefreshTokenCookieRepository({ config, cookiesRepository: createCookieRepository({ context }) });
      const rolesRepository = createRolesRepository({ db });

      if (!githubUser || !githubUser.email) {
        throw createUnauthorizedError();
      }

      const usersRepository = createUsersRepository({ db });

      const { user } = await getOrCreateUserFromProvider({
        usersRepository,
        providerUser: {
          email: githubUser.email,
          fullName: githubUser.name,
        },
        config,
      });

      const userId = user.id;

      const { accessToken } = await createAuthTokens({
        authTokensRepository,
        refreshTokenCookieRepository,
        rolesRepository,
        userId,
        config,
      });

      const redirectUrl = createAccessTokenRedirectionUrl({ accessToken, redirectionBaseUrl: config.client.oauthRedirectUrl });

      return context.redirect(redirectUrl);
    },
  );
}

export function registerGoogleProviderOauthRoute({ app }: { app: ServerInstance }) {
  app.get(
    '/api/auth/google',
    (context, next) => {
      const { config } = getConfig({ context });
      const { clientId, clientSecret } = config.auth.providers.google;

      const oauthMiddleware = googleAuth({
        scope: ['email', 'profile'],
        client_id: clientId,
        client_secret: clientSecret,
      });

      return oauthMiddleware(context, next);
    },
    async (context) => {
      const googleUser = context.get('user-google');
      const { db } = getDb({ context });
      const { config } = getConfig({ context });

      const authTokensRepository = createAuthTokensRepository({ db });
      const refreshTokenCookieRepository = createRefreshTokenCookieRepository({ config, cookiesRepository: createCookieRepository({ context }) });
      const rolesRepository = createRolesRepository({ db });

      if (!googleUser || !googleUser.email) {
        throw createUnauthorizedError();
      }

      const usersRepository = createUsersRepository({ db });

      const { user } = await getOrCreateUserFromProvider({
        usersRepository,
        providerUser: {
          email: googleUser.email,
          fullName: googleUser.name,
        },
        config,
      });

      const userId = user.id;

      const { accessToken } = await createAuthTokens({
        authTokensRepository,
        refreshTokenCookieRepository,
        rolesRepository,
        userId,
        config,
      });

      const redirectUrl = createAccessTokenRedirectionUrl({ accessToken, redirectionBaseUrl: config.client.oauthRedirectUrl });

      return context.redirect(redirectUrl);
    },
  );
}
