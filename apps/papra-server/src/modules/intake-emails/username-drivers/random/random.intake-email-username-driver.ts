import { generateId as generateHumanReadableId } from '@corentinth/friendly-ids';
import { createLogger } from '../../../shared/logger/logger';
import { defineIntakeEmailUsernameDriverFactory } from '../intake-email-username.models';

export const RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME = 'random';

export const randomIntakeEmailUsernameDriverFactory = defineIntakeEmailUsernameDriverFactory(({ logger = createLogger({ namespace: 'intake-emails.addresses-drivers.random' }) }) => {
  return {
    name: RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME,
    generateIntakeEmailUsername: async () => {
      const username = generateHumanReadableId();

      logger.debug({ username }, 'Generated email address');

      return { username };
    },
  };
});
