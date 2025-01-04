import { Hono } from 'hono';
import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { validateJsonBody, validateParams, validateQuery } from './validation';

function makeJsonBodyPayload(payload: Record<string, unknown>) {
  return {
    body: JSON.stringify(payload),
    headers: new Headers({ 'Content-Type': 'application/json' }),
  };
}

describe('validation', () => {
  describe('validateJsonBody', () => {
    describe('validateJsonBody creates a validation middleware that check the request json body against a schema', async () => {
      test('an invalid payload should trigger a 400 error', async () => {
        const app = new Hono().post('/', validateJsonBody(z.object({ name: z.string({ required_error: 'The name is required' }) })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/', { method: 'POST', ...makeJsonBodyPayload({ }) });
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid request body',
            code: 'server.invalid_request.body',
            details: [{
              path: 'name',
              message: 'The name is required',
            }],
          },
        });
      });

      test('a valid request should pass through', async () => {
        const app = new Hono().post('/', validateJsonBody(z.object({ name: z.string() })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/', { method: 'POST', ...makeJsonBodyPayload({ name: 'hono' }) });
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody).toEqual({ ok: true });
      });

      test('no additional properties should be allowed', async () => {
        const app = new Hono().post('/', validateJsonBody(z.object({ name: z.string() })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/', { method: 'POST', ...makeJsonBodyPayload({ name: 'hono', foo: 'bar' }) });
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid request body',
            code: 'server.invalid_request.body',
            details: [{
              message: 'Unrecognized key(s) in object: \'foo\'',
            }],
          },
        });
      });
    });
  });

  describe('validateQuery', () => {
    describe('validateQuery creates a validation middleware that check the request query parameters against a schema', async () => {
      test('an invalid query should trigger a 400 error', async () => {
        const app = new Hono().get('/', validateQuery(z.object({ name: z.string({ required_error: 'The name is required' }) })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/');
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid query parameters',
            code: 'server.invalid_request.query',
            details: [{
              path: 'name',
              message: 'The name is required',
            }],
          },
        });
      });

      test('a valid query should pass through', async () => {
        const app = new Hono().get('/', validateQuery(z.object({ name: z.string() })), (context) => {
          return context.json({ ok: true });
        });

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
        const app = new Hono().get('/:name', validateParams(z.object({ name: z.string().startsWith('foo-') })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/test');
        const responseBody = await response.json();

        expect(response.status).toBe(400);
        expect(responseBody).toEqual({
          error: {
            message: 'Invalid URL parameters',
            code: 'server.invalid_request.params',
            details: [
              {
                path: 'name',
                message: 'Invalid input: must start with "foo-"',
              },
            ],
          },
        });
      });

      test('a valid params should pass through', async () => {
        const app = new Hono().get('/:name', validateParams(z.object({ name: z.string().startsWith('foo-') })), (context) => {
          return context.json({ ok: true });
        });

        const response = await app.request('/foo-bar');
        const responseBody = await response.json();

        expect(response.status).toBe(200);
        expect(responseBody).toEqual({ ok: true });
      });
    });
  });
});
