import { urlSchema } from '../../../config/config.schemas';
import type { AppConfigDefinition } from '../../../config/config.types';
import * as v from 'valibot';

export const ollamaAdapterConfig = {
  baseUrl: {
    doc: 'Base URL for the Ollama API',
    schema: urlSchema,
    env: 'OLLAMA_BASE_URL',
    default: 'http://localhost:11434/v1',
    showInDocumentation: false,
  },
  apiKey: {
    doc: 'API key for the Ollama API',
    schema: v.string(),
    env: 'OLLAMA_API_KEY',
    default: 'ollama',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
