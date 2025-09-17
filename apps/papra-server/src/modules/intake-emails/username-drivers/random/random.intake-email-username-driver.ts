import { generateId as generateHumanReadableId } from '@corentinth/friendly-ids';
import { createLogger } from '../../../shared/logger/logger';
import { defineIntakeEmailAddressesDriverFactory } from '../intake-email-username.models';

export const RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME = 'random';

export const randomIntakeEmailAddressesDriverFactory = defineIntakeEmailAddressesDriverFactory(({ logger = createLogger({ namespace: 'intake-emails.addresses-drivers.random' }) }) => {
  return {
    name: RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME,
    generateIntakeEmailUsername: async () => {
      const username = generateHumanReadableId();

      logger.debug({ username }, 'Generated email address');

      return { username };
    },
  };
});
