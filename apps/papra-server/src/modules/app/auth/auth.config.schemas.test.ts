import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { domainListSchema } from './auth.config.schemas';

describe('auth config schemas', () => {
  describe('domainListSchema', () => {
    test('create a set of domain from a comma separated string or an array of strings', () => {
      expect(v.parse(domainListSchema, 'example.com, test.com')).toEqual(
        new Set(['example.com', 'test.com']),
      );

      expect(v.parse(domainListSchema, ['example.com', 'test.com'])).toEqual(
        new Set(['example.com', 'test.com']),
      );
    });

    test('the domains are trimmed and lowercased', () => {
      expect(v.parse(domainListSchema, ' Example.com , TEST.com ')).toEqual(
        new Set(['example.com', 'test.com']),
      );

      expect(v.parse(domainListSchema, [' Example.com ', ' TEST.com '])).toEqual(
        new Set(['example.com', 'test.com']),
      );
    });

    test('empty domains are filtered out', () => {
      expect(v.parse(domainListSchema, 'example.com, , test.com,   ')).toEqual(
        new Set(['example.com', 'test.com']),
      );

      expect(v.parse(domainListSchema, ['example.com', '', 'test.com', '   '])).toEqual(
        new Set(['example.com', 'test.com']),
      );
    });

    test('empty lists produce an empty set', () => {
      expect(v.parse(domainListSchema, '')).toEqual(new Set());
      expect(v.parse(domainListSchema, ' ,  , ')).toEqual(new Set());
      expect(v.parse(domainListSchema, [])).toEqual(new Set());
    });

    test('duplicate domains are removed', () => {
      expect(v.parse(domainListSchema, 'example.com, test.com, example.com')).toEqual(
        new Set(['example.com', 'test.com']),
      );

      expect(v.parse(domainListSchema, ['example.com', 'test.com', 'example.com'])).toEqual(
        new Set(['example.com', 'test.com']),
      );
    });

    test('invalid domains are rejected', () => {
      expect(() => v.parse(domainListSchema, 'example.com, inVAlid-domain, test.com')).toThrow(
        'Invalid domain: Received "invalid-domain"',
      );

      expect(() => v.parse(domainListSchema, ['@example.com'])).toThrow(
        'Invalid domain: Received "@example.com"',
      );
    });
  });
});
