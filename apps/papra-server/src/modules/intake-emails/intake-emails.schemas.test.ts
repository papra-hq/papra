import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { allowedOriginsSchema, intakeEmailIngestionEmailFieldSchema, intakeEmailsIngestionMetaSchema } from './intake-emails.schemas';

describe('intake-emails.schemas', () => {
  describe('intakeEmailsIngestionMetaSchema', () => {
    test('parses a valid ingestion meta object', () => {
      expect(v.parse(intakeEmailsIngestionMetaSchema, {
        from: { address: 'sender@example.com' },
        to: [{ address: 'recipient@example.com' }],
      })).toMatchObject({
        from: { address: 'sender@example.com' },
        to: [{ address: 'recipient@example.com' }],
        originalTo: [],
      });
    });

    test('defaults originalTo to an empty array when absent', () => {
      const result = v.parse(intakeEmailsIngestionMetaSchema, {
        from: { address: 'a@b.com' },
        to: [{ address: 'c@d.com' }],
      });
      expect(result.originalTo).toEqual([]);
    });

    test('parses optional name on email info', () => {
      const result = v.parse(intakeEmailsIngestionMetaSchema, {
        from: { address: 'a@b.com', name: 'Alice' },
        to: [{ address: 'c@d.com' }],
      });
      expect(result.from.name).toBe('Alice');
    });

    test('fails if from address is not a valid email', () => {
      expect(() => v.parse(intakeEmailsIngestionMetaSchema, {
        from: { address: 'not-an-email' },
        to: [{ address: 'c@d.com' }],
      })).toThrow();
    });
  });

  describe('intakeEmailIngestionEmailFieldSchema', () => {
    test('parses a valid JSON string into an ingestion meta object', () => {
      const json = JSON.stringify({
        from: { address: 'sender@example.com' },
        to: [{ address: 'recipient@example.com' }],
      });
      const result = v.parse(intakeEmailIngestionEmailFieldSchema, json);
      expect(result.from.address).toBe('sender@example.com');
    });

    test('fails if the string is not valid JSON', () => {
      expect(() => v.parse(intakeEmailIngestionEmailFieldSchema, 'not json')).toThrow();
    });

    test('fails if the parsed JSON does not match the meta schema', () => {
      expect(() => v.parse(intakeEmailIngestionEmailFieldSchema, JSON.stringify({ foo: 'bar' }))).toThrow();
    });
  });

  describe('allowedOriginsSchema', () => {
    test('parses an array of valid email addresses and lowercases them', () => {
      expect(v.parse(allowedOriginsSchema, ['User@Example.COM', 'other@test.org'])).toEqual(['user@example.com', 'other@test.org']);
    });

    test('returns undefined when the value is absent', () => {
      expect(v.parse(allowedOriginsSchema, undefined)).toBeUndefined();
    });

    test('fails if an entry is not a valid email address', () => {
      expect(() => v.parse(allowedOriginsSchema, ['not-an-email'])).toThrow();
    });
  });
});
