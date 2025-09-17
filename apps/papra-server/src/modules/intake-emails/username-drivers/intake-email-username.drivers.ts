import { RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME, randomIntakeEmailAddressesDriverFactory } from './random/random.intake-email-username-driver';

export const intakeEmailAddressesDrivers = {
  [RANDOM_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME]: randomIntakeEmailAddressesDriverFactory,
} as const;

export type IntakeEmailAddressesDriverName = keyof typeof intakeEmailAddressesDrivers;
