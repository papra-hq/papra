import { describe, expect, test } from 'vitest';
import { buildEmailAddress, getEmailUsername, getIsFromAllowedOrigin, getRecipientAddresses, parseEmailAddress } from './intake-emails.models';

describe('intake-emails models', () => {
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

  describe('buildEmailAddress', () => {
    test('it builds an email address from a username, a domain and an optional plus part', () => {
      expect(buildEmailAddress({ username: 'foo', domain: 'example.fr' })).to.eql('foo@example.fr');
      expect(buildEmailAddress({ username: 'foo', domain: 'example.fr', plusPart: 'bar' })).to.eql('foo+bar@example.fr');
    });
  });

  describe('parseEmailAddress', () => {
    test('it parses an email address into a username, a domain and an optional plus part', () => {
      expect(parseEmailAddress({ email: 'foo@example.fr' })).to.eql({ username: 'foo', domain: 'example.fr', plusPart: undefined });
      expect(parseEmailAddress({ email: 'foo+bar@example.fr' })).to.eql({ username: 'foo', domain: 'example.fr', plusPart: 'bar' });
      expect(parseEmailAddress({ email: 'foo+bar+baz@example.fr' })).to.eql({ username: 'foo', domain: 'example.fr', plusPart: 'bar+baz' });
    });
  });

  describe('getRecipientAddresses', () => {
    test(`the recipient addresses are the addresses the email was sent to, they are either in the to or originalTo fields, deduplicated
          there is a difference between to and originalTo as originalTo contains the actual email address used whereas to can be
          modified by mailing lists or email forwarding (like proton or cowmail)`, () => {
      const email = {
        to: [
          { address: 'foo@example.fr' },
          { address: 'bar@example.fr' },
        ],
        originalTo: [
          { address: 'foo@example.fr' },
          { address: 'baz@example.fr' },
        ],
      };

      expect(getRecipientAddresses({ email })).to.eql(['foo@example.fr', 'bar@example.fr', 'baz@example.fr']);
    });

    test('email addresses are deduplicated in a case insensitive way', () => {
      const email = {
        to: [
          { address: 'FOO@example.fr' },
          { address: 'BAR@example.fr' },
        ],
        originalTo: [
          { address: 'foo@example.fr' },
          { address: 'BAZ@example.fr' },
        ],
      };

      expect(getRecipientAddresses({ email })).to.eql(['foo@example.fr', 'bar@example.fr', 'baz@example.fr']);
    });
  });
});
