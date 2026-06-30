import { urlSchema } from '../../../config/config.schemas';
import * as v from 'valibot';
import { OPENAI_COMPATIBLE_ADAPTERS } from './openai-compatible.providers';
import type { OpenAiCompatibleAdapterDefinition } from './openai-compatible.types';
import { mapValues } from '@papra/std';

export const openAiAdaptersConfig = mapValues(
  OPENAI_COMPATIBLE_ADAPTERS,
  (adapter: OpenAiCompatibleAdapterDefinition) =>
    ({
      baseUrl: {
        doc: `Base URL for the ${adapter.label} API.`,
        schema: urlSchema,
        env: `${adapter.envPrefix}_BASE_URL`,
        default: adapter.defaultBaseUrl,
        showInDocumentation: false,
      },
      apiKey: {
        doc: `API key for the ${adapter.label} API.`,
        schema: v.string(),
        env: `${adapter.envPrefix}_API_KEY`,
        default: adapter.defaultApiKey ?? '',
        showInDocumentation: false,
      },
    }) as const,
);
