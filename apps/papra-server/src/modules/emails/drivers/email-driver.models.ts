import type { EmailDriverFactory } from '../emails.types';

export function defineEmailDriverFactory(factory: EmailDriverFactory) {
  return factory;
}
