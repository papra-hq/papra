import { describe, expect, test } from 'vitest';
import { registerEndpoint } from './contract.registration';
import { defineEndpointContract } from './contracts.models';
import * as v from 'valibot';
import { Hono } from 'hono';
import type { ServerInstance } from '../app/server.types';
import { isoDateTimeSchema } from './schemas/date.schemas';

describe('contract.registration', () => {
  describe('registerEndpoint', () => {
    const createOrganizationUserContract = defineEndpointContract({
      method: 'POST',
      path: '/api/organizations/:organizationId/users',
      params: v.object({
        organizationId: v.pipe(v.string(), v.startsWith('org_')),
      }),
      body: v.object({
        name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
      }),
      responses: {
        200: v.object({
          user: v.object({
            id: v.string(),
            name: v.string(),
            organizationId: v.string(),
          }),
        }),
      },
    });

    test('an endpoint can be registered and called successfully', async () => {
      const app = new Hono() as ServerInstance;

      registerEndpoint({
        app,
        contract: createOrganizationUserContract,
        handler: async ({ body, params }) => {
          return {
            status: 200,
            body: {
              user: {
                id: 'user_123',
                name: body.name,
                organizationId: params.organizationId,
              },
            },
          };
        },
      });

      const response = await app.request('/api/organizations/org_456/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'John Doe' }),
      });

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({
        user: {
          id: 'user_123',
          name: 'John Doe',
          organizationId: 'org_456',
        },
      });
    });

    test('handler values are normalized to their wire representation', async () => {
      const app = new Hono() as ServerInstance;
      const contract = defineEndpointContract({
        method: 'GET',
        path: '/api/date',
        responses: {
          200: v.object({ createdAt: isoDateTimeSchema }),
        },
      });

      registerEndpoint({
        app,
        contract,
        handler: async () => ({
          status: 200,
          body: { createdAt: new Date('2025-01-01T00:00:00.000Z') },
        }),
      });

      const response = await app.request('/api/date');

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ createdAt: '2025-01-01T00:00:00.000Z' });
    });

    test('an invalid path param returns a 400 error', async () => {
      const app = new Hono() as ServerInstance;

      registerEndpoint({
        app,
        contract: createOrganizationUserContract,
        handler: async ({ body, params }) => {
          return {
            status: 200,
            body: {
              user: {
                id: 'user_123',
                name: body.name,
                organizationId: params.organizationId,
              },
            },
          };
        },
      });

      const response = await app.request('/api/organizations/invalid_org_id/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'John Doe' }),
      });

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        error: {
          message: 'Invalid URL parameters',
          code: 'server.invalid_request.params',
          details: [
            {
              message: 'Invalid start: Expected "org_" but received "inva"',
              path: 'organizationId',
            },
          ],
        },
      });
    });

    test('an endpoint without a body does not try to parse one', async () => {
      const app = new Hono() as ServerInstance;
      const contract = defineEndpointContract({
        method: 'GET',
        path: '/api/health',
        responses: {
          200: v.object({ ok: v.boolean() }),
        },
      });

      registerEndpoint({
        app,
        contract,
        handler: async () => ({ status: 200, body: { ok: true } }),
      });

      const response = await app.request('/api/health');

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ ok: true });
    });

    test('an empty body is passed to the schema so defaults can be applied', async () => {
      const app = new Hono() as ServerInstance;
      const contract = defineEndpointContract({
        method: 'POST',
        path: '/api/default-body',
        body: v.object({ name: v.optional(v.string(), 'Pocky') }),
        responses: {
          200: v.object({ name: v.string() }),
        },
      });

      registerEndpoint({
        app,
        contract,
        handler: async ({ body }) => ({ status: 200, body }),
      });

      const response = await app.request('/api/default-body', { method: 'POST' });

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ name: 'Pocky' });
    });

    test('a missing required body returns a 400 error without calling the handler', async () => {
      const app = new Hono() as ServerInstance;
      let handlerCalled = false;

      registerEndpoint({
        app,
        contract: createOrganizationUserContract,
        handler: async () => {
          handlerCalled = true;
          return {
            status: 200,
            body: { user: { id: 'user_123', name: 'John', organizationId: 'org_456' } },
          };
        },
      });

      const response = await app.request('/api/organizations/org_456/users', { method: 'POST' });

      expect(response.status).to.eql(400);
      expect(handlerCalled).to.eql(false);
      expect(await response.json()).to.eql({
        error: {
          message: 'Invalid request body',
          code: 'server.invalid_request.body',
          details: [
            {
              message: 'Invalid key: Expected "name" but received undefined',
              path: 'name',
            },
          ],
        },
      });
    });

    test('malformed JSON returns a 400 error without calling the handler', async () => {
      const app = new Hono() as ServerInstance;
      let handlerCalled = false;

      registerEndpoint({
        app,
        contract: createOrganizationUserContract,
        handler: async () => {
          handlerCalled = true;
          return {
            status: 200,
            body: { user: { id: 'user_123', name: 'John', organizationId: 'org_456' } },
          };
        },
      });

      const response = await app.request('/api/organizations/org_456/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{',
      });

      expect(response.status).to.eql(400);
      expect(handlerCalled).to.eql(false);
      expect(await response.json()).to.eql({
        error: {
          message: 'Invalid request body',
          code: 'server.invalid_request.malformed_json',
        },
      });
    });

    test('an invalid body returns a 400 error without calling the handler', async () => {
      const app = new Hono() as ServerInstance;
      let handlerCalled = false;

      registerEndpoint({
        app,
        contract: createOrganizationUserContract,
        handler: async () => {
          handlerCalled = true;
          return {
            status: 200,
            body: { user: { id: 'user_123', name: 'John', organizationId: 'org_456' } },
          };
        },
      });

      const response = await app.request('/api/organizations/org_456/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(response.status).to.eql(400);
      expect(handlerCalled).to.eql(false);
      expect(await response.json()).toMatchObject({
        error: {
          message: 'Invalid request body',
          code: 'server.invalid_request.body',
        },
      });
    });

    test('repeated query parameters are passed to array schemas', async () => {
      const app = new Hono() as ServerInstance;
      const contract = defineEndpointContract({
        method: 'GET',
        path: '/api/tags',
        query: v.object({ tags: v.array(v.string()) }),
        responses: {
          200: v.object({ tags: v.array(v.string()) }),
        },
      });

      registerEndpoint({
        app,
        contract,
        handler: async ({ query }) => ({ status: 200, body: query }),
      });

      const response = await app.request('/api/tags?tags=finance&tags=to-review');

      expect(response.status).to.eql(200);
      expect(await response.json()).to.eql({ tags: ['finance', 'to-review'] });
    });

    test('an invalid query returns a 400 error without calling the handler', async () => {
      const app = new Hono() as ServerInstance;
      let handlerCalled = false;
      const contract = defineEndpointContract({
        method: 'GET',
        path: '/api/users',
        query: v.object({ page: v.pipe(v.string(), v.regex(/^\d+$/)) }),
        responses: {
          200: v.object({ ok: v.boolean() }),
        },
      });

      registerEndpoint({
        app,
        contract,
        handler: async () => {
          handlerCalled = true;
          return { status: 200, body: { ok: true } };
        },
      });

      const response = await app.request('/api/users?page=invalid');

      expect(response.status).to.eql(400);
      expect(handlerCalled).to.eql(false);
      expect(await response.json()).toMatchObject({
        error: {
          message: 'Invalid query parameters',
          code: 'server.invalid_request.query',
        },
      });
    });

    test('middlewares execute in registration order around the handler', async () => {
      const app = new Hono() as ServerInstance;
      const calls: string[] = [];
      const contract = defineEndpointContract({
        method: 'GET',
        path: '/api/middlewares',
        responses: {
          200: v.object({ ok: v.boolean() }),
        },
      });

      registerEndpoint({
        app,
        contract,
        middlewares: [
          async (_context, next) => {
            calls.push('middleware-1-before');
            await next();
            calls.push('middleware-1-after');
          },
          async (_context, next) => {
            calls.push('middleware-2-before');
            await next();
            calls.push('middleware-2-after');
          },
        ],
        handler: async () => {
          calls.push('handler');
          return { status: 200, body: { ok: true } };
        },
      });

      const response = await app.request('/api/middlewares');

      expect(response.status).to.eql(200);
      expect(calls).to.eql([
        'middleware-1-before',
        'middleware-2-before',
        'handler',
        'middleware-2-after',
        'middleware-1-after',
      ]);
    });
  });
});
