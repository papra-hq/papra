import { Hono } from 'hono';
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { validateJsonBody, validateParams, validateQuery } from './validation';

function jsonPayload(payload: Record<string, unknown>) {
  return {
    body: JSON.stringify(payload),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  };
}

describe('validation', () => {
  describe('validateJsonBody', () => {
    describe('validateJsonBody creates a validation middleware that check the request json body against a schema', async () => {
      test('an invalid payload should trigger a 400 error', async () => {
        const app = new Hono().post(
          '/',
          validateJsonBody(v.object({ name: v.string() })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/', { method: 'POST', ...jsonPayload({}) });
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid request body',
            code: 'server.invalid_request.body',
            details: [{
              path: 'name',
              message: 'Invalid key: Expected "name" but received undefined',
            }],
          },
        });
      });

      test('a valid request should pass through', async () => {
        const app = new Hono().post(
          '/',
          validateJsonBody(v.object({ name: v.string() })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/', { method: 'POST', ...jsonPayload({ name: 'hono' }) });
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody).toEqual({ ok: true });
      });

      test('no additional properties should be allowed', async () => {
        const app = new Hono().post(
          '/',
          validateJsonBody(v.strictObject({ name: v.string() })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/', { method: 'POST', ...jsonPayload({ name: 'hono', foo: 'bar' }) });
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid request body',
            code: 'server.invalid_request.body',
            details: [{
              path: 'foo',
              message: 'Invalid key: Expected never but received "foo"',
            }],
          },
        });
      });

      test('default values are applied', async () => {
        const app = new Hono().post(
          '/',
          validateJsonBody(v.object({ name: v.optional(v.string(), 'pocky') })),
          (context) => {
            const body = context.req.valid('json');
            return context.json({ ok: true, name: body.name });
          },
        );

        const response = await app.request('/', { method: 'POST' });
        const responseBody = await response.json();

        expect(responseBody).toEqual({ ok: true, name: 'pocky' });
      });
    });
  });

  describe('validateQuery', () => {
    describe('validateQuery creates a validation middleware that check the request query parameters against a schema', async () => {
      test('an invalid query should trigger a 400 error', async () => {
        const app = new Hono().get(
          '/',
          validateQuery(v.object({ name: v.string() })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/');
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid query parameters',
            code: 'server.invalid_request.query',
            details: [{
              path: 'name',
              message: 'Invalid key: Expected "name" but received undefined',
            }],
          },
        });
      });

      test('a valid query should pass through', async () => {
        const app = new Hono().get(
          '/',
          validateQuery(v.object({ name: v.string() })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/?name=hono');
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody).toEqual({ ok: true });
      });
    });
  });

  describe('validateParams', () => {
    describe('validateParams creates a validation middleware that check the request url parameters against a schema', async () => {
      test('an invalid params should trigger a 400 error', async () => {
        const app = new Hono().get(
          '/:name',
          validateParams(v.object({ name: v.pipe(v.string(), v.startsWith('foo-', 'Invalid input: must start with "foo-"')) })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/test');
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid URL parameters',
            code: 'server.invalid_request.params',
            details: [{
              path: 'name',
              message: 'Invalid input: must start with "foo-"',
            }],
          },
        });
      });

      test('a valid params should pass through', async () => {
        const app = new Hono().get(
          '/:name',
          validateParams(v.object({ name: v.pipe(v.string(), v.startsWith('foo-')) })),
          (context) => {
            return context.json({ ok: true });
          },
        );

        const response = await app.request('/foo-bar');
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody).toEqual({ ok: true });
      });
    });
  });
});
