import type { Config } from '../../config/config.types';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { UsersRepository } from '../../users/users.repository';
import type { IntakeEmailUsernameDriverName } from './intake-email-username.drivers';
import type { IntakeEmailUsernameDriver, IntakeEmailUsernameDriverFactory } from './intake-email-username.models';
import { createError } from '../../shared/errors/errors';
import { isNil } from '../../shared/utils';
import { intakeEmailUsernameDrivers } from './intake-email-username.drivers';

export type IntakeEmailUsernameServices = IntakeEmailUsernameDriver;

export function createIntakeEmailUsernameServices({
  config,
  ...dependencies
}: {
  config: Config;
  usersRepository: UsersRepository;
  organizationsRepository: OrganizationsRepository;
}) {
  const { driver } = config.intakeEmails.username;
  const intakeEmailUsernameDriver: IntakeEmailUsernameDriverFactory | undefined = intakeEmailUsernameDrivers[driver as IntakeEmailUsernameDriverName];

  if (isNil(intakeEmailUsernameDriver)) {
    throw createError({
      message: `Invalid intake email addresses driver ${driver}`,
      code: 'intake-emails.addresses.invalid_driver',
      statusCode: 500,
      isInternal: true,
    });
  }

  const intakeEmailUsernameServices = intakeEmailUsernameDriver({ config, ...dependencies });

  return intakeEmailUsernameServices;
}
