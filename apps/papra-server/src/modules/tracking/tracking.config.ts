import type { ConfigDefinition } from 'figue';
import * as v from 'valibot';
import { booleanishSchema, urlSchema } from '../config/config.schemas';

export const trackingConfig = {
  posthog: {
    isEnabled: {
      doc: 'Whether to enable PostHog',
      schema: booleanishSchema,
      default: false,
      env: 'POSTHOG_ENABLED',
    },
    apiKey: {
      doc: 'The API key for PostHog',
      schema: v.string(),
      default: 'set-me',
      env: 'POSTHOG_API_KEY',
    },
    host: {
      doc: 'The host for PostHog',
      schema: urlSchema,
      default: 'https://eu.i.posthog.com',
      env: 'POSTHOG_HOST',
    },
  },
} as const satisfies ConfigDefinition;
