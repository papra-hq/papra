import type { Organization } from 'better-auth/plugins';
import type { Config } from '../../config/config.types';
import type { User } from '../../users/users.types';

export type IntakeEmailsServices = {
  name: string;
  generateEmailAddress: (
    userHint?: User,
    organizationHint?: Organization
  ) => Promise<{ emailAddress: string }>;
  deleteEmailAddress: ({
    emailAddress,
  }: {
    emailAddress: string;
  }) => Promise<void>;
};

export type IntakeEmailDriverFactory = (args: {
  config: Config;
}) => IntakeEmailsServices;

export function defineIntakeEmailDriver(factory: IntakeEmailDriverFactory) {
  return factory;
}
