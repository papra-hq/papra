import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { serializeApiResponse } from './responses.serialize';

describe('serializeApiResponse', () => {
  test('bodyless responses preserve their status and headers', async () => {
    const response = serializeApiResponse({
      handlerResult: { status: 204, headers: { 'X-Request-Id': 'request-1' } },
      responseDefinitions: { 204: { description: 'No content.', content: {} } },
    });

    expect(response.status).toEqual(204);
    expect(response.headers.get('X-Request-Id')).toEqual('request-1');
    expect(response.headers.get('Content-Type')).toEqual(null);
    expect(await response.text()).toEqual('');
  });

  test('plain text responses use their body serializer and content type', async () => {
    const response = serializeApiResponse({
      handlerResult: { status: 200, contentType: 'text/plain', body: 'Hello' },
      responseDefinitions: {
        200: {
          description: 'A greeting.',
          content: { 'text/plain': { schema: v.string() } },
        },
      },
    });

    expect(response.status).toEqual(200);
    expect(response.headers.get('Content-Type')).toEqual('text/plain; charset=utf-8');
    expect(await response.text()).toEqual('Hello');
  });

  test('response schema transformations are not applied to wire-ready bodies', async () => {
    const response = serializeApiResponse({
      handlerResult: { status: 200, contentType: 'application/json', body: 'wire:value' },
      responseDefinitions: {
        200: {
          description: 'Already serialized output.',
          content: {
            'application/json': {
              schema: v.pipe(
                v.string(),
                v.transform((value) => `wire:${value}`),
              ),
            },
          },
        },
      },
    });

    expect(await response.json()).toEqual('wire:value');
  });

  test('content types must be declared for the returned status even when a serializer exists', () => {
    expect(() =>
      serializeApiResponse({
        handlerResult: { status: 200, contentType: 'text/plain', body: 'Hello' },
        responseDefinitions: {
          200: {
            description: 'A JSON greeting.',
            content: { 'application/json': { schema: v.string() } },
          },
        },
      }),
    ).toThrow('Undeclared response Content-Type');
  });

  test('contentful responses cannot omit the content type', () => {
    expect(() =>
      serializeApiResponse({
        handlerResult: { status: 200, body: 'Hello' },
        responseDefinitions: {
          200: { description: 'A greeting.', content: { 'text/plain': { schema: v.string() } } },
        },
      }),
    ).toThrow('Content-Type is required for non-empty responses');
  });

  test('bodyless responses cannot carry a body or content type', () => {
    expect(() =>
      serializeApiResponse({
        handlerResult: { status: 204, body: 'Hello' },
        responseDefinitions: { 204: { description: 'No content.', content: {} } },
      }),
    ).toThrow('Bodyless responses cannot include a body or Content-Type');

    expect(() =>
      serializeApiResponse({
        handlerResult: { status: 304, contentType: 'application/json' },
        responseDefinitions: { 304: { description: 'Not modified.', content: {} } },
      }),
    ).toThrow('Bodyless responses cannot include a body or Content-Type');
  });

  test('undeclared response statuses are rejected', () => {
    expect(() =>
      serializeApiResponse({
        handlerResult: { status: 201, contentType: 'application/json', body: {} },
        responseDefinitions: {},
      }),
    ).toThrow('Undeclared response status');
  });
});
