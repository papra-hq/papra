import type { Clock } from '../shared/clock/clock.types';
import { sign, verify } from 'hono/jwt';
import { JwtTokenInvalid, JwtTokenSignatureMismatched } from 'hono/utils/jwt/types';
import { systemClock } from '../shared/clock/clock';
import { deriveKeyWithHkdf } from '../shared/crypto/key-derivation';

const ACCESS_TOKEN_HKDF_INFO = 'document-share-link-access-token';
const ACCESS_TOKEN_ALGORITHM = 'HS256';

// Derive a dedicated signing key from the auth secret so share-link tokens can't be reused for anything else.
// The current password hash is folded into the derivation so that rotating (or removing) the share link
// password changes the signing key, invalidating every previously issued token via a signature mismatch.
function getSigningKey({ authSecret, passwordHash }: { authSecret: string; passwordHash: string }) {
  return deriveKeyWithHkdf({ key: authSecret, info: `${ACCESS_TOKEN_HKDF_INFO}:${passwordHash}` });
}

export async function issueShareLinkAccessToken({
  shareLinkId,
  passwordHash,
  authSecret,
  ttlMinutes,
  clock = systemClock,
}: {
  shareLinkId: string;
  passwordHash: string;
  authSecret: string;
  ttlMinutes: number;
  clock?: Clock;
}): Promise<{ accessToken: string }> {
  const nowSeconds = Math.floor(clock.now().epochMilliseconds / 1000);

  const accessToken = await sign(
    {
      shareLinkId,
      exp: nowSeconds + ttlMinutes * 60,
      iat: nowSeconds,
    },
    getSigningKey({ authSecret, passwordHash }),
    ACCESS_TOKEN_ALGORITHM,
  );

  return { accessToken };
}

// Returns whether the token is a valid, unexpired access token for the given share link.
// Expiry is checked against the injected clock rather than hono's internal wall-clock check, so it stays deterministic in tests.
export async function isShareLinkAccessTokenValid({
  accessToken,
  shareLinkId,
  passwordHash,
  authSecret,
  clock = systemClock,
}: {
  accessToken: string | undefined;
  shareLinkId: string;
  passwordHash: string;
  authSecret: string;
  clock?: Clock;
}): Promise<{ isValid: boolean }> {
  if (accessToken === undefined || accessToken === '') {
    return { isValid: false };
  }

  try {
    const payload = await verify(accessToken, getSigningKey({ authSecret, passwordHash }), { alg: ACCESS_TOKEN_ALGORITHM, exp: false, iat: false, nbf: false });

    if (payload.shareLinkId !== shareLinkId) {
      return { isValid: false };
    }

    const nowSeconds = Math.floor(clock.now().epochMilliseconds / 1000);
    const isExpired = typeof payload.exp === 'number' && payload.exp <= nowSeconds;

    return { isValid: !isExpired };
  } catch (error) {
    if (error instanceof JwtTokenInvalid || error instanceof JwtTokenSignatureMismatched) {
      return { isValid: false };
    }

    throw error;
  }
}
