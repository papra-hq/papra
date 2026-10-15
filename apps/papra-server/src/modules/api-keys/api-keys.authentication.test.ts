import { describe, expect, expectTypeOf, test } from 'vitest';
import { buildGetApiKeyFromHeaders } from './api-keys.authentication';

const token = `ppapi_${'a'.repeat(64)}`;

describe('buildGetApiKeyFromHeaders', () => {
  test('requests without an Authorization header do not look up API keys', async () => {
    let lookupCalled = false;
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async () => {
        lookupCalled = true;
        return null;
      },
    });

    expect(await getApiKey({ headers: new Headers() })).toEqual(null);
    expect(lookupCalled).toEqual(false);
  });

  test('other bearer tokens are left for downstream handlers without a lookup', async () => {
    let lookupCalled = false;
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async () => {
        lookupCalled = true;
        return null;
      },
    });

    expect(
      await getApiKey({ headers: new Headers({ Authorization: 'Bearer share.link.jwt' }) }),
    ).toEqual(null);
    expect(lookupCalled).toEqual(false);
  });

  test('API-key-shaped tokens are passed to the lookup and preserve its result type', async () => {
    const apiKey = { apiKeyId: 'ak_123', userId: 'usr_123' };
    const lookedUpTokens: string[] = [];
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async ({ token }) => {
        lookedUpTokens.push(token);
        return apiKey;
      },
    });

    const result = await getApiKey({ headers: new Headers({ authorization: `Bearer ${token}` }) });

    expectTypeOf(result).toEqualTypeOf<typeof apiKey | null>();
    expect(result).toEqual(apiKey);
    expect(lookedUpTokens).toEqual([token]);
  });

  test('unknown or expired keys remain unauthenticated when the lookup returns null', async () => {
    const getApiKey = buildGetApiKeyFromHeaders({ lookupApiKeyByToken: async () => null });

    expect(await getApiKey({ headers: new Headers({ Authorization: `Bearer ${token}` }) })).toEqual(
      null,
    );
  });

  test('malformed Authorization headers are rejected before lookup', async () => {
    let lookupCalled = false;
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async () => {
        lookupCalled = true;
        return null;
      },
    });

    await expect(
      getApiKey({ headers: new Headers({ Authorization: `Bearer ${token} extra` }) }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
    expect(lookupCalled).toEqual(false);
  });

  test('non-Bearer authorization schemes are rejected before lookup', async () => {
    let lookupCalled = false;
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async () => {
        lookupCalled = true;
        return null;
      },
    });

    await expect(
      getApiKey({ headers: new Headers({ Authorization: `Basic ${token}` }) }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
    expect(lookupCalled).toEqual(false);
  });

  test('lookup failures propagate rather than masquerading as missing credentials', async () => {
    const error = new Error('API-key storage unavailable');
    const getApiKey = buildGetApiKeyFromHeaders({
      lookupApiKeyByToken: async () => {
        throw error;
      },
    });

    await expect(
      getApiKey({ headers: new Headers({ Authorization: `Bearer ${token}` }) }),
    ).rejects.toEqual(error);
  });
});
