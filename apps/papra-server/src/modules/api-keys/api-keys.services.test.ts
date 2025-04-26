import { describe, expect, test } from 'vitest';
import { generateApiToken } from './api-keys.services';

describe('api-keys services', () => {
  describe('generateApiToken', () => {
    test('api token is a 64 random alphanumeric characters string prefixed with "ppapi_",', () => {
      const { token } = generateApiToken();

      expect(token).toMatch(/^ppapi_[a-zA-Z0-9]{64}$/);
    });
  });
});
