import type { Logger } from '@crowlog/logger';
import type { Config } from '../../config/config.types';

export type IntakeEmailAddressesDriver = {
  name: string;
  generateIntakeEmailUsername: () => Promise<{ username: string }>;
};

export type IntakeEmailAddressesDriverFactory = (args: { config: Config; logger?: Logger }) => IntakeEmailAddressesDriver;

export function defineIntakeEmailAddressesDriverFactory(factory: IntakeEmailAddressesDriverFactory) {
  return factory;
}
