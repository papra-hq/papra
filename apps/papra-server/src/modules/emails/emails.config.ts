import type { ConfigDefinition } from 'figue';
import { z } from 'zod';
import { emailDriverFactoryNames } from './drivers/email-driver';
import { LOGGER_EMAIL_DRIVER_NAME } from './drivers/logger/logger.email-driver';
import { loggerEmailDriverConfig } from './drivers/logger/logger.email-driver.config';
import { resendEmailDriverConfig } from './drivers/resend/resend.email-driver.config';

export const emailsConfig = {
  fromEmail: {
    doc: 'The email address to send emails from',
    schema: z.string(),
    default: 'Papra <auth@mail.papra.app>',
    env: 'EMAILS_FROM_ADDRESS',
  },
  driverName: {
    doc: `The driver to use when sending emails, value can be one of: ${emailDriverFactoryNames.map(x => `\`${x}\``).join(', ')}. Using \`logger\` will not send anything but log them instead`,
    schema: z.enum(emailDriverFactoryNames as [string, ...string[]]),
    default: LOGGER_EMAIL_DRIVER_NAME,
    env: 'EMAILS_DRIVER',
  },
  drivers: {
    resend: resendEmailDriverConfig,
    logger: loggerEmailDriverConfig,
  },
} as const satisfies ConfigDefinition;
