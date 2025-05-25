import { LOGGER_EMAIL_DRIVER_NAME, loggerEmailDriverFactory } from './logger/logger.email-driver';
import { RESEND_EMAIL_DRIVER_NAME, resendEmailDriverFactory } from './resend/resend.email-driver';
import { SMTP_EMAIL_DRIVER_NAME, smtpEmailDriverFactory } from './smtp/smtp.email-driver';

export const emailDrivers = {
  [RESEND_EMAIL_DRIVER_NAME]: resendEmailDriverFactory,
  [LOGGER_EMAIL_DRIVER_NAME]: loggerEmailDriverFactory,
  [SMTP_EMAIL_DRIVER_NAME]: smtpEmailDriverFactory,
} as const;

export const emailDriverFactoryNames = Object.keys(emailDrivers);
export type EmailDriverName = keyof typeof emailDrivers;
