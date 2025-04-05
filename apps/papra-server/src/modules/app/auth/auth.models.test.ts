import type { Config } from '../../config/config.types';
import { describe, expect, test } from 'vitest';
import { getTrustedOrigins } from './auth.models';

describe('auth models', () => {
  describe('getTrustedOrigins', () => {
    test('by default the trusted origins are only the baseUrl', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [] as string[],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(trustedOrigins).to.deep.equal(['http://localhost:3000']);
    });

    test('if the user defined a list of trusted origins, it returns the client baseUrl and the trustedOrigins deduplicated', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3001',
            'http://localhost:3002',
          ],
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(
        trustedOrigins,
      ).to.deep.equal([
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
      ]);
    });

    test('if the user disables the trusted origins, by setting the trustedOrigins to *, the trustedOrigins are not enabled', () => {
      const config = {
        client: {
          baseUrl: 'http://localhost:3000',
        },
        server: {
          trustedOrigins: '*',
        },
      } as Config;

      const { trustedOrigins } = getTrustedOrigins({ config });

      expect(trustedOrigins).to.equal(undefined);
    });
  });
});
