import * as v from 'valibot';
import { describe, expect, test } from 'vitest';
import { API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';
import { apiKeyPermissionsSchema } from './api-keys.schemas';

describe('api-keys.schemas', () => {
  describe('apiKeyPermissionsSchema', () => {
    test('accepts a single valid permission', () => {
      expect(v.parse(apiKeyPermissionsSchema, ['documents:read'])).toEqual(['documents:read']);
    });

    test('accepts multiple valid permissions', () => {
      const permissions = ['documents:read', 'documents:create', 'organizations:read'];
      expect(v.parse(apiKeyPermissionsSchema, permissions)).toEqual(permissions);
    });

    test('accepts all known permissions', () => {
      expect(v.parse(apiKeyPermissionsSchema, API_KEY_PERMISSIONS_VALUES)).toEqual(API_KEY_PERMISSIONS_VALUES);
    });

    test('rejects an empty array', () => {
      expect(() => v.parse(apiKeyPermissionsSchema, [])).toThrow();
    });

    test('rejects unknown permission values', () => {
      expect(() => v.parse(apiKeyPermissionsSchema, ['unknown:permission'])).toThrow();
      expect(() => v.parse(apiKeyPermissionsSchema, ['documents:read', 'invalid'])).toThrow();
    });

    test('rejects non-array inputs', () => {
      expect(() => v.parse(apiKeyPermissionsSchema, 'documents:read')).toThrow();
      expect(() => v.parse(apiKeyPermissionsSchema, null)).toThrow();
    });
  });
});
