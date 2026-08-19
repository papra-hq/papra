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
        contract: apiContract.users.getCurrentUser,
        request: {},
        authentication: { type: 'session' },
        fetch: fetchImplementation,
      });

      expect(receivedInit?.credentials).to.eql('include');
      expect(new Headers(receivedInit?.headers).has('Authorization')).to.eql(false);
      expect(response.status).to.eql(200);
      expect(response.body.user.createdAt).to.eql('2025-01-01T00:00:00.000Z');
    });

    test('rejects statuses that are not declared by the contract', async () => {
      const fetchImplementation: typeof globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: { message: 'Not found' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(
        callEndpoint({
          baseUrl: 'https://papra.test',
          contract: apiContract.users.getCurrentUser,
          request: {},
          fetch: fetchImplementation,
        }),
      ).rejects.toThrowError('No response schema declared for status 404 on GET /api/users/me');
    });
  });
});
