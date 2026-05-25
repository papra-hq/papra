import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';

export const loggerEmailDriverConfig = {
  level: {
    doc: 'When using the logger email driver, the level to log emails at',
    schema: v.picklist(['info', 'debug', 'warn', 'error']),
    default: 'info',
    env: 'LOGGER_EMAIL_DRIVER_LOG_LEVEL',
  },
} as const satisfies ConfigDefinition;
