import { urlSchema } from '../../../config/config.schemas';
import type { AppConfigDefinition } from '../../../config/config.types';
import * as v from 'valibot';

export const openAiAdapterConfig = {
  baseUrl: {
    doc: 'Base URL for the OpenAI API, configure this to use an OpenAI-compatible API like Ollama or OpenRouter',
    schema: urlSchema,
    env: 'OPENAI_BASE_URL',
    default: 'https://api.openai.com/v1',
    showInDocumentation: false,
  },
  apiKey: {
    doc: 'API key for the OpenAI API, configure this to use an OpenAI-compatible API like Ollama or OpenRouter',
    schema: v.string(),
    env: 'OPENAI_API_KEY',
    default: 'set-me',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
