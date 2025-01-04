import { addDays } from 'date-fns';
import { sign, verify } from 'hono/jwt';
import { isString } from 'lodash-es';
import { createUnauthorizedError } from './auth.errors';

export async function generateUserJwt({
  userId,
  jwtSecret,
  roles = [],
  now = new Date(),
}: {
  userId: string;
  jwtSecret: string;
  roles?: string[];
  now?: Date;
}) {
  const token = await sign({
    sub: userId,
    // TODO: extract token expiration delay to config
    exp: Math.floor(now.getTime() / 1000) + 60 * 10,
    roles,
  }, jwtSecret);

  return { token };
}

export async function verifyJwt({ token, jwtSecret }: { token: string; jwtSecret: string }) {
  const jwtPayload = await verify(token, jwtSecret);

  if (!jwtPayload) {
    throw createUnauthorizedError();
  }

  return jwtPayload;
}

export async function verifyUserJwt({ token, jwtSecret }: { token: string; jwtSecret: string }) {
  const jwtPayload = await verify(token, jwtSecret);

  if (!jwtPayload) {
    throw createUnauthorizedError();
  }

  const userId = jwtPayload.sub;

  if (!userId || !isString(userId)) {
    throw createUnauthorizedError();
  }

  return { userId };
}

export async function verifyUserRefreshToken({ refreshToken, jwtRefreshSecret }: { refreshToken: string; jwtRefreshSecret: string }) {
  const jwtPayload = await verify(refreshToken, jwtRefreshSecret);

  if (!jwtPayload) {
    throw createUnauthorizedError();
  }

  const userId = jwtPayload.sub;

  if (!userId || !isString(userId)) {
    throw createUnauthorizedError();
  }

  return { userId };
}

export async function generateUserRefreshToken({ userId, jwtSecret, now = new Date(), expiresAt = addDays(now, 14) }: { userId: string; jwtSecret: string; now?: Date; expiresAt?: Date }) {
  const refreshToken = await sign(
    {
      sub: userId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    },
    jwtSecret,
  );

  return { refreshToken };
}
