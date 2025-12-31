import { describe, expect, test } from 'vitest';
import { getSecretFromTotpUri } from './2fa.models';

describe('2fa models', () => {
  describe('getSecretFromTotpUri', () => {
    test('in a valid TOTP URI the secret is a query parameter', () => {
      expect(
        getSecretFromTotpUri({
          totpUri: 'otpauth://totp/Papra:foo.bar%40gmail.com?secret=KFBVEMJQIVFW6RKMJNWTQ42OPBKG63DBK4YWSX2LG4REOQRXGZ3Q&issuer=Papra&digits=6&period=30',
        }),
      ).to.equal('KFBVEMJQIVFW6RKMJNWTQ42OPBKG63DBK4YWSX2LG4REOQRXGZ3Q');
    });

    test('if the TOTP URI does not have a secret query parameter, an empty string is returned', () => {
      expect(
        getSecretFromTotpUri({
          totpUri: 'otpauth://totp/Papra:foo.bar%40gmail.com?issuer=Papra&digits=6&period=30',
        }),
      ).to.equal('');
    });

    test('if the TOTP URI is malformed, an empty string is returned', () => {
      expect(
        getSecretFromTotpUri({
          totpUri: 'not-a-valid-uri',
        }),
      ).to.equal('');
    });
  });
});
