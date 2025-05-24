import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const loggerEmailDriverConfig = {
  level: {
    doc: 'When using the logger email driver, the level to log emails at',
    schema: z.enum(['info', 'debug', 'warn', 'error']),
    default: 'info',
    env: 'LOGGER_EMAIL_DRIVER_LOG_LEVEL',
  },
} as const satisfies ConfigDefinition;
