import type { ApiKeyPermissions } from '../api-keys/api-keys.types';
import { describe, expect, test } from 'vitest';
import { buildGetApiKeyFromHeaders } from '../api-keys/api-keys.authentication';
import { wrapWithLoggerContext } from '../shared/logger/logger';
import { buildResolveAuthenticationContext } from './api.authentication';

const token = `ppapi_${'a'.repeat(64)}`;
const apiKey = {
  userId: 'usr_123',
  apiKeyId: 'ak_123',
  permissions: ['documents:read', 'tags:read'] satisfies ApiKeyPermissions[],
};

describe('buildResolveAuthenticationContext', () => {
  test('session requests without an API-key token do not query API-key storage', async () => {
    let lookupCalled = false;
    const createResolver = buildResolveAuthenticationContext({
      getSession: async ({ headers }) => {
        expect(headers.get('Cookie')).toEqual('session=test');
        return { userId: 'usr_session' };
      },
      getApiKey: buildGetApiKeyFromHeaders({
        lookupApiKeyByToken: async () => {
          lookupCalled = true;
          return apiKey;
        },
      }),
    });
    const resolveContext = createResolver();
    const request = new Request('https://papra.test', { headers: { Cookie: 'session=test' } });

    const context = await wrapWithLoggerContext({}, async () => resolveContext({ request }));

    expect(context).toEqual({ userId: 'usr_session', authType: 'session' });
    expect(lookupCalled).toEqual(false);
  });

  test('a missing session on a session-only route is rejected without looking up an API key', async () => {
    let lookupCalled = false;
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async () => {
        lookupCalled = true;
        return apiKey;
      },
    });
    const resolveContext = createResolver();
    const request = new Request('https://papra.test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await expect(resolveContext({ request })).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
    expect(lookupCalled).toEqual(false);
  });

  test('simultaneous valid session and API-key credentials are rejected even for the same user', async () => {
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => ({ userId: apiKey.userId }),
      getApiKey: buildGetApiKeyFromHeaders({ lookupApiKeyByToken: async () => apiKey }),
    });
    const request = new Request('https://papra.test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    await expect(createResolver()({ request })).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
    await expect(
      createResolver({ apiKeyPermissions: ['documents:read'] })({ request }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
  });

  test('an unrecognized or expired API key does not invalidate a valid session', async () => {
    const lookedUpTokens: string[] = [];
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => ({ userId: 'usr_session' }),
      getApiKey: buildGetApiKeyFromHeaders({
        lookupApiKeyByToken: async ({ token }) => {
          lookedUpTokens.push(token);
          return null;
        },
      }),
    });
    const resolveContext = createResolver();
    const request = new Request('https://papra.test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const context = await wrapWithLoggerContext({}, async () => resolveContext({ request }));

    expect(context).toEqual({ userId: 'usr_session', authType: 'session' });
    expect(lookedUpTokens).toEqual([token]);
  });

  test('API keys with every required permission provide their owner and key identity', async () => {
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async ({ headers }) => {
        expect(headers.get('Authorization')).toEqual(`Bearer ${token}`);
        return apiKey;
      },
    });
    const resolveContext = createResolver({ apiKeyPermissions: ['documents:read', 'tags:read'] });
    const request = new Request('https://papra.test', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const context = await wrapWithLoggerContext({}, async () => resolveContext({ request }));

    expect(context).toEqual({ userId: 'usr_123', apiKeyId: 'ak_123', authType: 'api-key' });
  });

  test('API keys missing any required permission are rejected', async () => {
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async () => apiKey,
    });
    const resolveContext = createResolver({
      apiKeyPermissions: ['documents:read', 'documents:update'],
    });

    await expect(
      resolveContext({ request: new Request('https://papra.test') }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
  });

  test('an explicit empty permission list accepts valid API keys without permissions', async () => {
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async () => ({ ...apiKey, permissions: [] }),
    });
    const resolveContext = createResolver({ apiKeyPermissions: [] });

    const context = await wrapWithLoggerContext({}, async () =>
      resolveContext({ request: new Request('https://papra.test') }),
    );

    expect(context).toEqual({ userId: 'usr_123', apiKeyId: 'ak_123', authType: 'api-key' });
  });

  test('requests without valid credentials are rejected even when API keys are allowed', async () => {
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async () => null,
    });
    const resolveContext = createResolver({ apiKeyPermissions: [] });

    await expect(
      resolveContext({ request: new Request('https://papra.test') }),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'auth.unauthorized',
    });
  });

  test('authentication lookup failures propagate instead of becoming unauthorized errors', async () => {
    const error = new Error('API-key storage unavailable');
    const createResolver = buildResolveAuthenticationContext({
      getSession: async () => null,
      getApiKey: async () => {
        throw error;
      },
    });
    const resolveContext = createResolver({ apiKeyPermissions: ['documents:read'] });

    await expect(resolveContext({ request: new Request('https://papra.test') })).rejects.toEqual(
      error,
    );
  });
});
