import type { Config } from '../../config/config.types';

export type IntakeEmailsServices = {
  name: string;
  createEmailAddress: (args: { username: string }) => Promise<{ emailAddress: string }>;
  deleteEmailAddress: (args: { emailAddress: string }) => Promise<void>;
};

export type IntakeEmailDriverFactory = (args: { config: Config }) => IntakeEmailsServices;

export function defineIntakeEmailDriver(factory: IntakeEmailDriverFactory) {
  return factory;
}
