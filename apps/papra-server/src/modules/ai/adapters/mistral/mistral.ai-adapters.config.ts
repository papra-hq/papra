import { urlSchema } from '../../../config/config.schemas';
import type { AppConfigDefinition } from '../../../config/config.types';
import * as v from 'valibot';

export const mistralAdapterConfig = {
  baseUrl: {
    doc: 'Base URL for the Mistral API',
    schema: urlSchema,
    env: 'MISTRAL_BASE_URL',
    default: 'https://api.mistral.ai/v1',
    showInDocumentation: false,
  },
  apiKey: {
    doc: 'API key for the Mistral API',
    schema: v.string(),
    env: 'MISTRAL_API_KEY',
    default: 'mistral-api-key',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
