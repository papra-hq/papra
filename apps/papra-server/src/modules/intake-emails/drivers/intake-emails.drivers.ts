import { RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME, randomUsernameIntakeEmailDriverFactory } from './random-username/random-username.intake-email-driver';

export const intakeEmailDrivers = {
  [RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME]: randomUsernameIntakeEmailDriverFactory,
} as const;

export type IntakeEmailDriverName = keyof typeof intakeEmailDrivers;
