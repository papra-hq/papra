import {
  OWLRELAY_INTAKE_EMAIL_DRIVER_NAME,
  owlrelayIntakeEmailDriverFactory,
} from "./owlrelay/owlrelay.intake-email-driver";
import {
  RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME,
  randomUsernameIntakeEmailDriverFactory,
} from "./random-username/random-username.intake-email-driver";
import {
  SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME,
  schemaUsernameIntakeEmailDriverFactory,
} from "./schema-username/schema-username.intake-email-driver";

export const intakeEmailDrivers = {
  [RANDOM_USERNAME_INTAKE_EMAIL_DRIVER_NAME]:
    randomUsernameIntakeEmailDriverFactory,
  [OWLRELAY_INTAKE_EMAIL_DRIVER_NAME]: owlrelayIntakeEmailDriverFactory,
  [SCHEMA_USERNAME_INTAKE_EMAIL_DRIVER_NAME]:
    schemaUsernameIntakeEmailDriverFactory,
} as const;

export type IntakeEmailDriverName = keyof typeof intakeEmailDrivers;
