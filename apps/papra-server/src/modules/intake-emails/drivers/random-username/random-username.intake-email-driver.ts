import { generateId as generateHumanReadableId } from '@corentinth/friendly-ids';
import { defineIntakeEmailDriver } from '../intake-emails.drivers.models';

export const RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME = 'random-username';

export const randomUsernameIntakeEmailDriverFactory = defineIntakeEmailDriver(({ config }) => {
  const { domain } = config.intakeEmails.drivers.randomUsername;

  return {
    name: RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME,
    generateEmailAddress: async () => {
      const randomUsername = generateHumanReadableId();

      return {
        emailAddress: `${randomUsername}@${domain}`,
      };
    },
    // Deletion functionality is not required for this driver
    deleteEmailAddress: async () => {},
  };
});
