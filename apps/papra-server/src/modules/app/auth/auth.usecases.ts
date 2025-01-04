import type { Config } from '../../config/config.types';
import type { RolesRepository } from '../../roles/roles.repository';
import type { UsersRepository } from '../../users/users.repository';
import type { DbInsertableUser } from '../../users/users.types';
import type { AuthTokensRepository } from './auth-tokens/auth-tokens.repository';
import type { RefreshTokenCookieRepository } from './refresh-tokens/refresh-token.cookie.repository';
import { addDays } from 'date-fns';
import { createUser } from '../../users/users.usecases';
import { createUnauthorizedError } from './auth.errors';
import { generateUserJwt, generateUserRefreshToken, verifyUserRefreshToken } from './auth.services';
import { REFRESH_TOKEN_DURATION_IN_DAYS } from './refresh-tokens/refresh-token.constants';

export async function getOrCreateUserFromProvider({
  usersRepository,
  providerUser,
  config,
}: {
  usersRepository: UsersRepository;
  providerUser: DbInsertableUser;
  config: Config;
}) {
  const { email } = providerUser;

  const { user: existingUser } = await usersRepository.getUserByEmail({ email });

  if (existingUser) {
    return {
      user: existingUser,
    };
  }

  const { user: newUser } = await createUser({
    user: providerUser,
    usersRepository,
    config,
  });

  return {
    user: newUser,
  };
}

export async function createAuthTokens({
  userId,
  config,
  authTokensRepository,
  refreshTokenCookieRepository,
  rolesRepository,
  now = new Date(),
}: {
  userId: string;
  config: Config;
  authTokensRepository: AuthTokensRepository;
  refreshTokenCookieRepository: RefreshTokenCookieRepository;
  rolesRepository: RolesRepository;
  now?: Date;
}) {
  const { jwtSecret, jwtRefreshSecret } = config.auth;

  const { roles } = await rolesRepository.getUserRoles({ userId });

  const { token: accessToken } = await generateUserJwt({ userId, jwtSecret, roles });
  const { refreshToken } = await generateUserRefreshToken({ userId, jwtSecret: jwtRefreshSecret });

  // TODO: create a refreshTokenRepository as a wrapper around the authTokensRepository
  // Save the refresh token in the database
  await authTokensRepository.saveAuthToken({ userId, token: refreshToken, expiresAt: addDays(now, REFRESH_TOKEN_DURATION_IN_DAYS) });

  // Store the refresh token in a cookie
  await refreshTokenCookieRepository.saveRefreshTokenInCookie({ refreshToken });

  return { accessToken };
}

export async function renewAuthTokens({
  config,
  authTokensRepository,
  refreshTokenCookieRepository,
  rolesRepository,
  now = new Date(),
}: {
  config: Config;
  authTokensRepository: AuthTokensRepository;
  refreshTokenCookieRepository: RefreshTokenCookieRepository;
  rolesRepository: RolesRepository;
  now?: Date;
}) {
  const { jwtRefreshSecret } = config.auth;

  // Get the refresh token from the cookies
  const { refreshToken } = await refreshTokenCookieRepository.getRefreshTokenFromCookieOrThrow();

  // Verify the refresh token is a valid JWT token
  const { userId } = await verifyUserRefreshToken({ refreshToken, jwtRefreshSecret });

  // Verify the refresh token is in the DB and not expired
  const { isValid } = await authTokensRepository.getAuthTokenValidity({ token: refreshToken, userId });

  // Delete the refresh token from the database to prevent replay attacks
  await authTokensRepository.deleteAuthToken({ token: refreshToken });

  if (!isValid) {
    throw createUnauthorizedError();
  }

  const { accessToken } = await createAuthTokens({
    userId,
    config,
    authTokensRepository,
    refreshTokenCookieRepository,
    rolesRepository,
    now,
  });

  return { accessToken };
}
