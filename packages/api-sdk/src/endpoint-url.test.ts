import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import { defineEndpointContract } from '@papra/app-server/api/contracts/models';
import type { InferClientRequest } from '@papra/app-server/api/contracts/types';
import { buildEndpointUrl } from './endpoint-url';

const contract = defineEndpointContract({
  method: 'GET',
  path: '/api/organizations/:organizationId/documents/:documentId',
  params: v.object({
    organizationId: v.string(),
    documentId: v.string(),
  }),
  query: v.object({
    search: v.string(),
    page: v.number(),
    active: v.boolean(),
    tags: v.array(v.string()),
    createdAfter: v.date(),
  }),
  responses: {
    200: v.object({ ok: v.boolean() }),
  },
});

const request: InferClientRequest<typeof contract> = {
  params: {
    organizationId: 'org/123',
    documentId: 'doc with spaces',
  },
  query: {
    search: 'annual report',
    page: 2,
    active: false,
    tags: ['finance', 'to review'],
    createdAfter: new Date('2025-01-01T00:00:00.000Z'),
  },
};

describe('endpoint-url', () => {
  describe('buildEndpointUrl', () => {
    test('builds a URL with encoded path and query parameters', () => {
      expect(
        buildEndpointUrl({
          baseUrl: 'https://papra.test/root?ignored=true#ignored',
          contract,
          request,
        }),
      ).to.eql(
        'https://papra.test/root/api/organizations/org%2F123/documents/doc%20with%20spaces?search=annual+report&page=2&active=false&tags=finance&tags=to+review&createdAfter=2025-01-01T00%3A00%3A00.000Z',
      );
    });

    test('supports endpoints without params or query values', () => {
      const bodylessContract = defineEndpointContract({
        method: 'GET',
        path: '/api/health',
        responses: {
          200: v.object({ ok: v.boolean() }),
        },
      });

      expect(
        buildEndpointUrl({
          baseUrl: 'https://papra.test',
          contract: bodylessContract,
          request: {},
        }),
      ).to.eql('https://papra.test/api/health');
    });

    test('rejects missing path parameters', () => {
      const invalidRequest = {
        ...request,
        params: { organizationId: 'org_123' },
      } as unknown as InferClientRequest<typeof contract>;

      expect(() =>
        buildEndpointUrl({
          baseUrl: 'https://papra.test',
          contract,
          request: invalidRequest,
        }),
      ).toThrowError(
        'Missing path parameter "documentId" for GET /api/organizations/:organizationId/documents/:documentId',
      );
    });

    test('rejects query values that cannot be serialized', () => {
      const unsupportedQueryContract = defineEndpointContract({
        method: 'GET',
        path: '/api/documents',
        query: v.object({ filter: v.unknown() }),
        responses: {
          200: v.object({ ok: v.boolean() }),
        },
      });

      expect(() =>
        buildEndpointUrl({
          baseUrl: 'https://papra.test',
          contract: unsupportedQueryContract,
          request: { query: { filter: { owner: 'usr_123' } } },
        }),
      ).toThrowError('Query parameter "filter" cannot be serialized');
    });
  });
});
