import type { Config } from '../../config/config.types';

export type IntakeEmailsServices = {
  name: string;
  generateEmailAddress: () => Promise<{ emailAddress: string }>;
  deleteEmailAddress: ({ emailAddress }: { emailAddress: string }) => Promise<void>;
};

export type IntakeEmailDriverFactory = (args: { config: Config }) => IntakeEmailsServices;

export function defineIntakeEmailDriver(factory: IntakeEmailDriverFactory) {
  return factory;
}
