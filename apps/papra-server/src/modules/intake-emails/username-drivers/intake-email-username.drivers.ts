import { patternIntakeEmailUsernameDriverFactory } from './pattern/pattern.intake-email-username-driver';
import { PATTERN_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME } from './pattern/pattern.intake-email-username-driver.config';
import { RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME, randomIntakeEmailUsernameDriverFactory } from './random/random.intake-email-username-driver';

export const intakeEmailUsernameDrivers = {
  [RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME]: randomIntakeEmailUsernameDriverFactory,
  [PATTERN_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME]: patternIntakeEmailUsernameDriverFactory,
} as const;

export type IntakeEmailUsernameDriverName = keyof typeof intakeEmailUsernameDrivers;
