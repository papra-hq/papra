import { LOGGER_EMAIL_DRIVER_NAME, loggerEmailDriverFactory } from './logger/logger.email-driver';
import { RESEND_EMAIL_DRIVER_NAME, resendEmailDriverFactory } from './resend/resend.email-driver';

export const emailDrivers = {
  [RESEND_EMAIL_DRIVER_NAME]: resendEmailDriverFactory,
  [LOGGER_EMAIL_DRIVER_NAME]: loggerEmailDriverFactory,
} as const;

export const emailDriverFactoryNames = Object.keys(emailDrivers);
export type EmailDriverName = keyof typeof emailDrivers;
