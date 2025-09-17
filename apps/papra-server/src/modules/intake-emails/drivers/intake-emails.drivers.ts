import { CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME, catchAllIntakeEmailDriverFactory } from './catch-all/catch-all.intake-email-driver';
import { OWLRELAY_INTAKE_EMAIL_DRIVER_NAME, owlrelayIntakeEmailDriverFactory } from './owlrelay/owlrelay.intake-email-driver';

export const intakeEmailDrivers = {
  [OWLRELAY_INTAKE_EMAIL_DRIVER_NAME]: owlrelayIntakeEmailDriverFactory,
  [CATCH_ALL_INTAKE_EMAIL_DRIVER_NAME]: catchAllIntakeEmailDriverFactory,
} as const;

export type IntakeEmailDriverName = keyof typeof intakeEmailDrivers;
