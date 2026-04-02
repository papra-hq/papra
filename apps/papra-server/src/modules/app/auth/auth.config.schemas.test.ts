import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { forbiddenEmailDomainsSchema } from './auth.config.schemas';

describe('auth config schemas', () => {
  describe('forbiddenEmailDomainsSchema', () => {
    test('create a set of domain from a comma separated string or an array of strings', () => {
      expect(v.parse(
        forbiddenEmailDomainsSchema,
        'example.com, test.com',
      )).to.eql(new Set(['example.com', 'test.com']));

      expect(v.parse(
        forbiddenEmailDomainsSchema,
        ['example.com', 'test.com'],
      )).to.eql(new Set(['example.com', 'test.com']));
    });

    test('the domains are trimmed and lowercased', () => {
      expect(v.parse(
        forbiddenEmailDomainsSchema,
        ' Example.com , TEST.com ',
      )).to.eql(new Set(['example.com', 'test.com']));

      expect(v.parse(
        forbiddenEmailDomainsSchema,
        [' Example.com ', ' TEST.com '],
      )).to.eql(new Set(['example.com', 'test.com']));
    });

    test('empty domains are filtered out', () => {
      expect(v.parse(
        forbiddenEmailDomainsSchema,
        'example.com, , test.com,   ',
      )).to.eql(new Set(['example.com', 'test.com']));

      expect(v.parse(
        forbiddenEmailDomainsSchema,
        ['example.com', '', 'test.com', '   '],
      )).to.eql(new Set(['example.com', 'test.com']));
    });

    test('duplicate domains are removed', () => {
      expect(v.parse(
        forbiddenEmailDomainsSchema,
        'example.com, test.com, example.com',
      )).to.eql(new Set(['example.com', 'test.com']));

      expect(v.parse(
        forbiddenEmailDomainsSchema,
        ['example.com', 'test.com', 'example.com'],
      )).to.eql(new Set(['example.com', 'test.com']));
    });

    test('invalid domains are rejected', () => {
      expect(() => v.parse(
        forbiddenEmailDomainsSchema,
        'example.com, inVAlid-domain, test.com',
      )).to.throw('Invalid domain: Received "invalid-domain"');

      expect(() => v.parse(
        forbiddenEmailDomainsSchema,
        ['@example.com'],
      )).to.throw('Invalid domain: Received "@example.com"');
    });
  });
});
