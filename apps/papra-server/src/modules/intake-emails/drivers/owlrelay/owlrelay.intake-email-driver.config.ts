import type { ConfigDefinition } from 'figue';

import * as v from 'valibot';

export const owlrelayIntakeEmailDriverConfig = {
  owlrelayApiKey: {
    doc: 'The API key used to interact with OwlRelay for the intake emails',
    schema: v.string(),
    default: 'change-me',
    env: 'OWLRELAY_API_KEY',
  },
  webhookUrl: {
    doc: 'The webhook URL to use when generating email addresses for intake emails with OwlRelay, if not provided, the webhook will be inferred from the server URL',
    schema: v.optional(v.string()),
    default: undefined,
    env: 'OWLRELAY_WEBHOOK_URL',
  },
  domain: {
    doc: 'The domain to use when generating email addresses for intake emails with OwlRelay, if not provided, the OwlRelay will use their default domain',
    schema: v.optional(v.string()), // TODO: check valid hostname
    default: undefined,
    env: 'OWLRELAY_DOMAIN',
  },
} as const satisfies ConfigDefinition;
