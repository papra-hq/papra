import { describe, expect, test } from 'vitest';
import { registerEndpoint } from './contract.registration';
import { defineEndpointContract } from './contracts.models';
import * as v from 'valibot';
import { Hono } from 'hono';
import type { ServerInstance } from '../app/server.types';

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

    test('an invalid ath param returns a 400 error', async () => {
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
  });
});
