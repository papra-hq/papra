import { API_KEY_PERMISSIONS as SERVER_PERMISSIONS } from '@papra/app-server/apiKeys/constants';
import { describe, expect, test } from 'vitest';
import { API_KEY_PERMISSIONS } from './api-keys.constants';

describe('api-keys.constants', () => {
  describe('api keys permissions', () => {
    test('all server side permissions should be defined in client', () => {
      expect(API_KEY_PERMISSIONS.flatMap((section) => section.permissions).toSorted()).to.eql(
        Object.values(SERVER_PERMISSIONS)
          .flatMap((permissions) => Object.values(permissions))
          .toSorted(),
        'Some server side permissions are missing in client side API_KEY_PERMISSIONS',
      );
    });
  });
});
