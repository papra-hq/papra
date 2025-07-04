import type { Config } from '../config/config.types';
import type { IntakeEmailDriverName } from './drivers/intake-emails.drivers';
import type { IntakeEmailDriverFactory } from './drivers/intake-emails.drivers.models';
import { createError } from '../shared/errors/errors';
import { isNil } from '../shared/utils';
import { intakeEmailDrivers } from './drivers/intake-emails.drivers';

export function createIntakeEmailsServices({ config }: { config: Config }) {
  const intakeEmailDriver: IntakeEmailDriverFactory | undefined = intakeEmailDrivers[config.intakeEmails.driver as IntakeEmailDriverName];

  if (isNil(intakeEmailDriver)) {
    throw createError({
      message: `Invalid intake email driver ${config.intakeEmails.driver}`,
      code: 'intake-emails.invalid_driver',
      statusCode: 500,
      isInternal: true,
    });
  }

  const intakeEmailsServices = intakeEmailDriver({ config });

  return intakeEmailsServices;
}
