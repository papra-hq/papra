import { describe, expect, expectTypeOf, test } from 'vitest';
import * as v from 'valibot';
import { apiContract } from '@papra/app-server/api/contracts';
import { defineEndpointContract } from '@papra/app-server/api/contracts/models';
import { isoDateTimeSchema } from '@papra/app-server/api/schemas/date';
import { callEndpoint } from './contract-client';

const createDocumentContract = defineEndpointContract({
  method: 'POST',
  path: '/api/organizations/:organizationId/documents',
  params: v.object({ organizationId: v.string() }),
  body: v.object({ createdAt: isoDateTimeSchema, name: v.string() }),
  responses: {
    201: v.object({ id: v.string(), createdAt: isoDateTimeSchema }),
  },
});

describe('contract-client', () => {
  describe('callEndpoint', () => {
    test('builds and parses a contract request with API key authentication', async () => {
      let receivedUrl: string | undefined;
      let receivedInit: RequestInit | undefined;
      const fetchImplementation: typeof globalThis.fetch = async (input, init) => {
        receivedUrl =
          typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        receivedInit = init;

        return new Response(
          JSON.stringify({ id: 'doc_123', createdAt: '2025-01-01T00:00:00.000Z' }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      };

      const response = await callEndpoint({
        baseUrl: 'https://papra.test',
        contract: createDocumentContract,
        request: {
          params: { organizationId: 'org_123' },
          body: {
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            name: 'Report',
          },
        },
        authentication: { type: 'api-key', token: 'ppapi_secret' },
        fetch: fetchImplementation,
      });

      expect(receivedUrl).to.eql('https://papra.test/api/organizations/org_123/documents');
      expect(receivedInit?.method).to.eql('POST');
      expect(new Headers(receivedInit?.headers).get('Authorization')).to.eql('Bearer ppapi_secret');
      expect(new Headers(receivedInit?.headers).get('Content-Type')).to.eql('application/json');
      expect(receivedInit?.body).to.eql(
        JSON.stringify({ createdAt: '2025-01-01T00:00:00.000Z', name: 'Report' }),
      );
      expect(response).to.eql({
        status: 201,
        body: { id: 'doc_123', createdAt: '2025-01-01T00:00:00.000Z' },
      });

      if (response.status !== 201) {
        throw new Error('Expected a 201 response');
      }

      expectTypeOf(response.body.createdAt).toEqualTypeOf<string>();
    });

    test('supports session cookie authentication with a colocated API contract', async () => {
      let receivedInit: RequestInit | undefined;
      const fetchImplementation: typeof globalThis.fetch = async (_input, init) => {
        receivedInit = init;

        return new Response(
          JSON.stringify({
            user: {
              id: 'usr_123',
              email: 'john@example.com',
              name: 'John',
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-02T00:00:00.000Z',
              twoFactorEnabled: false,
              permissions: ['documents:read'],
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      };

      const response = await callEndpoint({
        baseUrl: 'https://papra.test',
        contract: apiContract.getCurrentUser,
        request: {},
        authentication: { type: 'session' },
        fetch: fetchImplementation,
      });

      expect(receivedInit?.credentials).to.eql('include');
      expect(new Headers(receivedInit?.headers).has('Authorization')).to.eql(false);
      expect(response.status).to.eql(200);

      if (response.status !== 200) {
        throw new Error('Expected a 200 response');
      }

      expect(response.body.user.createdAt).to.eql('2025-01-01T00:00:00.000Z');
    });

    test('returns endpoint-specific errors as typed responses', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            error: { message: 'User not found', code: 'users.not_found' },
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          },
        );

      const response = await callEndpoint({
        baseUrl: 'https://papra.test',
        contract: apiContract.getCurrentUser,
        request: {},
        fetch: fetchImplementation,
      });

      expect(response).to.eql({
        status: 404,
        body: { error: { message: 'User not found', code: 'users.not_found' } },
      });

      if (response.status !== 404) {
        throw new Error('Expected a 404 response');
      }

      expectTypeOf(response.body.error.code).toEqualTypeOf<'users.not_found'>();
    });

    test('returns common errors as typed responses', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(
          JSON.stringify({
            error: { message: 'Unauthorized', code: 'auth.unauthorized' },
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          },
        );

      const response = await callEndpoint({
        baseUrl: 'https://papra.test',
        contract: apiContract.getCurrentUser,
        request: {},
        fetch: fetchImplementation,
      });

      if (response.status !== 401) {
        throw new Error('Expected a 401 response');
      }

      expect(response.body.error.code).to.eql('auth.unauthorized');
      expectTypeOf(response.body.error.code).toEqualTypeOf<'auth.unauthorized'>();
    });

    test('rejects statuses that are not declared by the contract', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 418,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toMatchObject({
        name: 'PapraContractError',
        reason: 'undeclared_status',
        status: 418,
      });
    });

    test('rejects error codes that are not declared for the status', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: { message: 'Unknown', code: 'unknown.error' } }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toMatchObject({
        name: 'PapraContractError',
        reason: 'undeclared_error',
        status: 400,
      });
    });

    test('wraps malformed JSON for a declared response', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response('{', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toMatchObject({
        name: 'PapraContractError',
        reason: 'invalid_response_json',
        status: 200,
      });
    });

    test('wraps schema-invalid declared responses', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(JSON.stringify({ user: { id: 'usr_123' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toMatchObject({
        name: 'PapraContractError',
        reason: 'invalid_response_body',
        status: 200,
      });
    });

    test('preserves fetch errors', async () => {
      const networkError = new Error('Network unavailable');
      const fetchImplementation: typeof globalThis.fetch = async () => {
        throw networkError;
      };

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toBe(networkError);
    });
  });
});
