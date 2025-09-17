import { buildEmailAddress } from '../../intake-emails.models';
import { defineIntakeEmailDriver } from '../intake-emails.drivers.models';

export const CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME = 'catch-all';

// This driver is used when no external service is used to manage the email addresses
// like for example when using a catch-all domain
export const catchAllIntakeEmailDriverFactory = defineIntakeEmailDriver(({ config }) => {
  const { domain } = config.intakeEmails.drivers.catchAll;

  return {
    name: CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME,
    createEmailAddress: async ({ username }) => {
      const emailAddress = buildEmailAddress({ username, domain });

      return { emailAddress };
    },
    deleteEmailAddress: async () => {},
  };
});
