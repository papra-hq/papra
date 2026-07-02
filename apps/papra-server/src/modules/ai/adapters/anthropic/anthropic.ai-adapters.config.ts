import * as v from 'valibot';
import type { AppConfigDefinition } from '../../../config/config.types';
import { urlSchema } from '../../../config/config.schemas';

export const anthropicAdaptersConfig = {
  baseUrl: {
    doc: 'Base URL for the Anthropic API.',
    schema: v.optional(urlSchema),
    env: `ANTHROPIC_BASE_URL`,
    default: undefined,
  },
  apiKey: {
    doc: 'API key for the Anthropic API.',
    schema: v.string(),
    env: `ANTHROPIC_API_KEY`,
    default: '',
  },
} as const satisfies AppConfigDefinition;
