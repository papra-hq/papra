import { aiModelIdSchema, aiModelsAdapterConfigSchema } from './ai.schemas';
import { booleanishSchema } from '../config/config.schemas';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from './ai.constants';

export const aiConfig = {
  isEnabled: {
    doc: 'Whether AI features are enabled',
    schema: booleanishSchema,
    env: 'AI_IS_ENABLED',
    default: false,
    showInDocumentation: false,
  },
  adapters: {
    doc: 'List of AI models adapter configurations',
    schema: aiModelsAdapterConfigSchema,
    env: 'AI_ADAPTERS',
    default: [],
    showInDocumentation: false,
  },
  defaultModelId: {
    doc: 'Default AI model to use when no specific model is specified, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b", where the <adapterId> is the id of the adapter defined in the AI_ADAPTERS env variable.',
    schema: aiModelIdSchema,
    env: AI_DEFAULT_MODEL_ENV_KEY,
    default: 'unknown',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
