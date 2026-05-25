import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { allowedWebhookUrlHostnamesSchema } from './webhooks.config.schemas';

describe('webhooks config schemas', () => {
  describe('allowedWebhookUrlHostnamesSchema', () => {
    test('creates a set of allowed webhook hostnames from an array of strings', () => {
      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, ['example.com', 'foo.bar', '127.0.0.1']),
      ).toEqual(
        new Set(['example.com', 'foo.bar', '127.0.0.1']),
      );
    });

    test('creates a set of allowed webhook hostnames from a comma-separated string', () => {
      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, 'example.com,foo.bar'),
      ).toEqual(
        new Set(['example.com', 'foo.bar']),
      );

      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, 'example.com ,   foo.bar   '),
      ).toEqual(
        new Set(['example.com', 'foo.bar']),
      );
    });

    test('duplicate hostnames are removed and hostnames are normalized to lowercase', () => {
      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, 'example.com,EXAMPLE.COM,foo.bar,FOO.BAR'),
      ).toEqual(
        new Set(['example.com', 'foo.bar']),
      );
    });

    test('usual non-standard hostnames are allowed', () => {
      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, 'localhost,myapp,stuff.local'),
      ).toEqual(
        new Set(['localhost', 'myapp', 'stuff.local']),
      );
    });

    test('empty hostnames are filtered out', () => {
      expect(
        v.parse(allowedWebhookUrlHostnamesSchema, 'example.com,,foo.bar,   ,'),
      ).toEqual(
        new Set(['example.com', 'foo.bar']),
      );
    });
  });
});
