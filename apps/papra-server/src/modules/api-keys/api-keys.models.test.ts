import { describe, expect, test } from 'vitest';
import { getApiKeyUiPrefix, looksLikeAnApiKey } from './api-keys.models';
import { generateApiToken } from './api-keys.services';

describe('api-keys models', () => {
  describe('getApiKeyUiPrefix', () => {
    test('the prefix is what the user will see in the ui in order to identify the api key, it is the first 5 characters of the token regardless of the token prefix', () => {
      expect(
        getApiKeyUiPrefix({ token: 'ppapi_29qxv9eCbRkQQGhwrVZCEXEFjOYpXZX07G4vDK4HT03Jp7fVHyJx1b0l6e1LIEPD' }),
      ).to.eql(
        { prefix: 'ppapi_29qxv' },
      );
    });
  });

  describe('looksLikeAnApiKey', () => {
    test(`validate that a token looks like an api key
        - it starts with the api key prefix
        - it has the correct length
        - it only contains alphanumeric characters`, () => {
      expect(
        looksLikeAnApiKey('ppapi_29qxv9eCbRkQQGhwrVZCEXEFjOYpXZX07G4vDK4HT03Jp7fVHyJx1b0l6e1LIEPD'),
      ).toBe(true);

      expect(
        looksLikeAnApiKey(''),
      ).toBe(false);

      expect(
        looksLikeAnApiKey('ppapi_'),
      ).toBe(false);

      expect(
        looksLikeAnApiKey('ppapi_29qxv9eCbRkQQGhwrVZCEXEFjOYpXZX07G4vDK4HT03Jp7fVHyJx1b0l6e1LIEPD_extra'),
      ).toBe(false);

      expect(
        looksLikeAnApiKey('invalidprefix_29qxv9eCbRkQQGhwrVZCEXEFjOYpXZX07G4vDK4HT03Jp7fVHyJx1b0l6e1LIEPD'),
      ).toBe(false);
    });

    test('a freshly generated token should always look like an api key', () => {
      const { token } = generateApiToken();

      expect(
        looksLikeAnApiKey(token),
      ).toBe(true);
    });
  });
});
