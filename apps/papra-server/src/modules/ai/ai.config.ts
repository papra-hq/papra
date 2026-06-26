import { aiModelIdSchema } from './ai.schemas';
import { booleanishSchema } from '../config/config.schemas';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from './ai.constants';
import { ollamaAdapterConfig } from './adapters/ollama/ollama.ai-adapters.config';
import { openAiAdapterConfig } from './adapters/openai/openai.ai-adapters.config';
import { OPENAI_ADAPTER_NAME } from './adapters/openai/openai.ai-adapters';

export const aiConfig = {
  isEnabled: {
    doc: 'Whether AI features are enabled',
    schema: booleanishSchema,
    env: 'AI_IS_ENABLED',
    default: false,
    showInDocumentation: false,
  },
  adapters: {
    ollama: ollamaAdapterConfig,
    openai: openAiAdapterConfig,
  },
  defaultAdapterName: {
    doc: `Default AI adapter to use when no specific adapter is specified in the model id.`,
    schema: aiModelIdSchema,
    env: 'AI_DEFAULT_ADAPTER',
    default: OPENAI_ADAPTER_NAME,
    showInDocumentation: false,
  },
  defaultModelId: {
    doc: 'Default AI model to use when no specific model is specified, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b". The adapterId can be omitted, like "llama3.1:8b", in which case the default adapter will be used. The modelName is adapter-specific.',
    schema: aiModelIdSchema,
    env: AI_DEFAULT_MODEL_ENV_KEY,
    default: 'unknown',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
