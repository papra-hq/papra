import type { ServerInstanceGenerics } from '../server.types';
import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { createError } from '../../shared/errors/errors';
import { registerErrorMiddleware } from './errors.middleware';

describe('errors middleware', () => {
  describe('registerErrorMiddleware', () => {
    test('when a non-internal custom error is thrown with a status code, the error is returned', async () => {
      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      app.get('/error', async () => {
        throw createError({
          message: 'Custom error',
          code: 'custom.error',
          statusCode: 400,
        });
      });

      const response = await app.request('/error', { method: 'GET' });

      expect(response.status).to.eql(400);
      expect(await response.json()).to.eql({
        error: {
          code: 'custom.error',
          message: 'Custom error',
        },
      });
    });

    test('when an unknown error is thrown, a 500 error is returned with a generic message', async () => {
      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      app.get('/error', async () => {
        throw new Error('Unknown error');
      });

      const response = await app.request('/error', { method: 'GET' });

      expect(response.status).to.eql(500);
      expect(await response.json()).to.eql({
        error: {
          code: 'internal.error',
          message: 'An error occurred',
        },
      });
    });

    test('when a custom error is marked as internal, a 500 error is returned with a generic message', async () => {
      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      app.get('/error', async () => {
        throw createError({
          message: 'Custom error',
          code: 'custom.error',
          statusCode: 400,
          isInternal: true,
        });
      });

      const response = await app.request('/error', { method: 'GET' });

      expect(response.status).to.eql(500);
      expect(await response.json()).to.eql({
        error: {
          code: 'internal.error',
          message: 'An error occurred',
        },
      });
    });

    test('when querying an unknown route, a 404 error is returned', async () => {
      const app = new Hono<ServerInstanceGenerics>();
      registerErrorMiddleware({ app });

      const response = await app.request('/unknown-route', { method: 'GET' });

      expect(response.status).to.eql(404);
      expect(await response.json()).to.eql({
        error: {
          code: 'api.not-found',
          message: 'API route not found',
        },
      });
    });
  });
});
