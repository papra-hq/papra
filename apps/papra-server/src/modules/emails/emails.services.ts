import type { Config } from '../config/config.types';
import type { EmailDriverName } from './drivers/email-driver';
import type { EmailDriverFactory } from './emails.types';
import { createError } from '../shared/errors/errors';
import { createLogger } from '../shared/logger/logger';
import { isNil } from '../shared/utils';
import { emailDrivers } from './drivers/email-driver';

export type EmailsServices = ReturnType<typeof createEmailsServices>;

export function createEmailsServices({ config }: { config: Config }) {
  const { driverName } = config.emails;

  const emailDriver: EmailDriverFactory | undefined = emailDrivers[driverName as EmailDriverName];

  if (isNil(emailDriver)) {
    throw createError({
      message: `Invalid email driver ${driverName}`,
      code: 'emails.invalid_driver',
      statusCode: 500,
      isInternal: true,
    });
  }

  const logger = createLogger({ namespace: 'emails.services' });

  logger.info({ driverName }, 'Creating emails services');

  const emailServices = emailDriver({ config, logger });

  return emailServices;
}
