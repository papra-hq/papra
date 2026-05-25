import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { intakeEmailUsernameDrivers } from './intake-email-username.drivers';
import { patternIntakeEmailDriverConfig } from './pattern/pattern.intake-email-username-driver.config';
import { RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME } from './random/random.intake-email-username-driver';

export const intakeEmailUsernameConfig = {
  driver: {
    doc: `The driver to use when generating email addresses for intake emails, value can be one of: ${Object.keys(intakeEmailUsernameDrivers).map(x => `\`${x}\``).join(', ')}`,
    schema: v.picklist(Object.keys(intakeEmailUsernameDrivers)),
    default: RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME,
    env: 'INTAKE_EMAILS_USERNAME_DRIVER',
  },
  drivers: {
    pattern: patternIntakeEmailDriverConfig,
  },
} as const satisfies ConfigDefinition;
