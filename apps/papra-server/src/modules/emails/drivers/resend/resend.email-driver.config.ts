import type { ConfigDefinition } from 'figue';
import { z } from 'zod';

export const resendEmailDriverConfig = {
  resendApiKey: {
    doc: 'The API key for the Resend email service',
    schema: z.string(),
    default: '',
    env: 'RESEND_API_KEY',
  },
} as const satisfies ConfigDefinition;
