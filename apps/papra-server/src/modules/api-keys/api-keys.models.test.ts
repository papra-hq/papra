import { describe, expect, test } from 'vitest';
import { getApiKeyUiPrefix } from './api-keys.models';

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
});
