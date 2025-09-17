import type { Config } from '../../config/config.types';
import type { IntakeEmailAddressesDriverName } from './intake-email-username.drivers';
import type { IntakeEmailAddressesDriver, IntakeEmailAddressesDriverFactory } from './intake-email-username.models';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { intakeEmailAddressesDrivers } from './intake-email-username.drivers';

export type IntakeEmailAddressesServices = IntakeEmailAddressesDriver;

export function createIntakeEmailAddressesServices({ config }: { config: Config }) {
  const { driver } = config.intakeEmails.username;
  const intakeEmailAddressesDriver: IntakeEmailAddressesDriverFactory | undefined = intakeEmailAddressesDrivers[driver as IntakeEmailAddressesDriverName];

  if (isNil(intakeEmailAddressesDriver)) {
    throw createError({
      message: `Invalid intake email addresses driver ${driver}`,
      code: 'intake-emails.addresses.invalid_driver',
      statusCode: 500,
      isInternal: true,
    });
  }

  const intakeEmailAddressesServices = intakeEmailAddressesDriver({ config });

  return intakeEmailAddressesServices;
}
