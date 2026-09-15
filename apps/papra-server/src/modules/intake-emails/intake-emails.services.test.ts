import { describe, expect, test } from 'vitest';
import { overrideConfig } from '../config/config.test-utils';
import { createIntakeEmailsServices } from './intake-emails.services';

describe('intake email services', () => {
  describe('getDomains', () => {
    test('returns the configured catch-all domain', () => {
      const config = overrideConfig({
        intakeEmails: {
          driver: 'catch-all',
          drivers: {
            catchAll: {
              domain: 'intake.example.com',
            },
          },
        },
      });

      const intakeEmailsServices = createIntakeEmailsServices({ config });

      expect(intakeEmailsServices.getDomains()).to.eql(['intake.example.com']);
    });

    test('returns the configured OwlRelay domain', () => {
      const config = overrideConfig({
        intakeEmails: {
          driver: 'owlrelay',
          drivers: {
            owlrelay: {
              domain: 'relay.example.com',
            },
          },
        },
      });

      const intakeEmailsServices = createIntakeEmailsServices({ config });

      expect(intakeEmailsServices.getDomains()).to.eql(['relay.example.com']);
    });

    test('returns no domains when OwlRelay selects the domain', () => {
      const config = overrideConfig({
        intakeEmails: {
          driver: 'owlrelay',
        },
      });

      const intakeEmailsServices = createIntakeEmailsServices({ config });

      expect(intakeEmailsServices.getDomains()).to.eql([]);
    });
  });
});
