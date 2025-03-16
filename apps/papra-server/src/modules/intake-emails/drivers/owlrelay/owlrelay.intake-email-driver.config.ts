import type { ConfigDefinition } from 'figue';

import { z } from 'zod';

export const owlrelayIntakeEmailDriverConfig = {
  owlrelayApiKey: {
    doc: 'The API key used to interact with OwlRelay for the intake emails',
    schema: z.string(),
    default: 'change-me',
    env: 'OWLRELAY_API_KEY',
  },
  webhookUrl: {
    doc: 'The webhook URL to use when generating email addresses for intake emails with OwlRelay, if not provided, the webhook will be inferred from the server URL',
    schema: z.string().optional(),
    default: undefined,
    env: 'OWLRELAY_WEBHOOK_URL',
  },
} as const satisfies ConfigDefinition;
