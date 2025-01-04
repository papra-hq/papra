import type { Config } from '../../../config/config.types';
import type { CookieRepository } from '../../cookies/cookies.repository';
import { injectArguments } from '@corentinth/chisels';
import { addDays } from 'date-fns';
import { createUnauthorizedError } from '../auth.errors';
import { REFRESH_TOKEN_COOKIE_DURATION_IN_DAYS, REFRESH_TOKEN_COOKIE_NAME } from './refresh-token.constants';

export type RefreshTokenCookieRepository = ReturnType<typeof createRefreshTokenCookieRepository>;

export function createRefreshTokenCookieRepository({ cookiesRepository, config }: { cookiesRepository: CookieRepository; config: Config }) {
  return injectArguments(
    {
      saveRefreshTokenInCookie,
      getRefreshTokenFromCookie,
      getRefreshTokenFromCookieOrThrow,
      deleteRefreshTokenCookie,
    },
    { cookiesRepository, config },
  );
}

async function saveRefreshTokenInCookie({
  cookiesRepository,
  config,
  refreshToken,
  now = new Date(),
  expiresAt = addDays(now, REFRESH_TOKEN_COOKIE_DURATION_IN_DAYS),
}: {
  refreshToken: string;
  cookiesRepository: CookieRepository;
  config: Config;
  now?: Date;
  expiresAt?: Date;
}) {
  await cookiesRepository.setSignedCookie({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    value: refreshToken,
    secret: config.auth.refreshTokenCookieSecret,
    options: {
      expires: expiresAt,
      httpOnly: true,
      secure: true,
    },
  });
}

async function getRefreshTokenFromCookieOrThrow({ cookiesRepository, config }: { cookiesRepository: CookieRepository; config: Config }) {
  const { refreshToken } = await getRefreshTokenFromCookie({ cookiesRepository, config });

  if (!refreshToken) {
    throw createUnauthorizedError();
  }

  return { refreshToken };
}

async function getRefreshTokenFromCookie({ cookiesRepository, config }: { cookiesRepository: CookieRepository; config: Config }) {
  const refreshToken = await cookiesRepository.getSignedCookie({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    secret: config.auth.refreshTokenCookieSecret,
  });

  return { refreshToken };
}

async function deleteRefreshTokenCookie({ cookiesRepository }: { cookiesRepository: CookieRepository }) {
  await cookiesRepository.deleteCookie({
    cookieName: REFRESH_TOKEN_COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: true,
    },
  });
}
