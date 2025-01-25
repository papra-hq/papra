import { describe, expect, test } from 'vitest';
import { getEmailUsername, getIsFromAllowedOrigin, getIsIntakeEmailWebhookSecretValid } from './intake-emails.models';

describe('intake-emails models', () => {
  describe('getIsIntakeEmailWebhookSecretValid', () => {
    test('the authorization header from the email intake webhook should be a bearer token with the api secret', () => {
      expect(
        getIsIntakeEmailWebhookSecretValid({
          secret: 'foo',
          authorizationHeader: 'Bearer foo',
        }),
      ).to.eql(true);

      expect(
        getIsIntakeEmailWebhookSecretValid({
          secret: 'foo',
          authorizationHeader: 'Bearer bar',
        }),
      ).to.eql(false);

      expect(
        getIsIntakeEmailWebhookSecretValid({
          secret: 'foo',
          authorizationHeader: 'Bearer ',
        }),
      ).to.eql(false);

      expect(
        getIsIntakeEmailWebhookSecretValid({
          secret: 'foo',
          authorizationHeader: undefined,
        }),
      ).to.eql(false);
    });
  });

  describe('getEmailUsername', () => {
    test('the username is the whole part of the email address before the @', () => {
      expect(getEmailUsername({ email: 'foo@example.fr' })).to.eql({ username: 'foo' });
      expect(getEmailUsername({ email: 'foo+bar@example.fr' })).to.eql({ username: 'foo+bar' });
      expect(getEmailUsername({ email: undefined })).to.eql({ username: undefined });
    });
  });

  describe('getIsFromAllowedOrigin', () => {
    test('an origin is allowed if it is in the list of the intake email allowed origins email address', () => {
      expect(
        getIsFromAllowedOrigin({
          origin: 'foo@example.fr',
          allowedOrigins: ['foo@example.fr', 'bar@example.fr'],
        }),
      ).to.eql(true);

      expect(
        getIsFromAllowedOrigin({
          origin: 'bar@example.fr',
          allowedOrigins: ['foo@example.fr'],
        }),
      ).to.eql(false);
    });

    test('email addresses are case insensitive', () => {
      expect(
        getIsFromAllowedOrigin({
          origin: 'FOo@exAmple.fr',
          allowedOrigins: ['foo@examPLE.fr'],
        }),
      ).to.eql(true);
    });

    test('if no allowed origins are provided, the origin is not allowed', () => {
      expect(
        getIsFromAllowedOrigin({
          origin: 'foo@example.fr',
          allowedOrigins: [],
        }),
      ).to.eql(false);
    });
  });
});
