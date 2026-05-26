import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema } from '../../config/config.schemas';
import { objectKeys } from '../../shared/objects';
import { USER_PROVIDED_USERNAME_STRATEGY_NAME } from './intake-email-username.constants';
import { intakeEmailUsernameDrivers } from './intake-email-username.drivers';
import { patternIntakeEmailDriverConfig } from './pattern/pattern.intake-email-username-driver.config';
import { RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME } from './random/random.intake-email-username-driver';

const intakeEmailUsernameDriverNames = [...objectKeys(intakeEmailUsernameDrivers), USER_PROVIDED_USERNAME_STRATEGY_NAME] as const;

export const intakeEmailUsernameConfig = {
  driver: {
    doc: `The driver to use when generating email addresses for intake emails, value can be one of: ${intakeEmailUsernameDriverNames.map(x => `\`${x}\``).join(', ')}`,
    schema: v.picklist(intakeEmailUsernameDriverNames),
    default: RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME,
    env: 'INTAKE_EMAILS_USERNAME_DRIVER',
  },
  drivers: {
    pattern: patternIntakeEmailDriverConfig,
  },
  isDenyListEnabled: {
    doc: 'When true, enables the built-in deny list that prevents users from claiming common role-account usernames (admin, support, postmaster, ...).',
    schema: booleanishSchema,
    default: true,
    env: 'INTAKE_EMAILS_USERNAME_ENABLE_DENY_LIST',
  },
} as const satisfies ConfigDefinition;
