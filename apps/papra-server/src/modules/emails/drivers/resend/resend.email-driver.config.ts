import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';

export const resendEmailDriverConfig = {
  resendApiKey: {
    doc: 'The API key for the Resend email service',
    schema: v.string(),
    default: '',
    env: 'RESEND_API_KEY',
  },
} as const satisfies ConfigDefinition;
