import { aiModelIdSchema } from './ai.schemas';
import { booleanishSchema } from '../config/config.schemas';
import type { AppConfigDefinition } from '../config/config.types';
import * as v from 'valibot';
import { AI_DEFAULT_MODEL_ENV_KEY } from './ai.constants';
import { AI_ADAPTERS_NAMES, AI_DEFAULT_ADAPTER_NAME } from './adapters/ai-adapters.constants';
import { openAiAdaptersConfig } from './adapters/openai-compatible/openai-compatible.config';
import { anthropicAdaptersConfig } from './adapters/anthropic/anthropic.ai-adapters.config';

export const aiConfig = {
  isEnabled: {
    doc: 'Whether AI features are enabled',
    schema: booleanishSchema,
    env: 'AI_IS_ENABLED',
    default: false,
    showInDocumentation: false,
  },
  adapters: {
    anthropic: anthropicAdaptersConfig,
    ...openAiAdaptersConfig,
  },
  defaultAdapterName: {
    doc: `Default AI adapter to use when no specific adapter is specified in the model id. Available adapters: ${AI_ADAPTERS_NAMES.join(', ')}`,
    schema: v.picklist(AI_ADAPTERS_NAMES),
    env: 'AI_DEFAULT_ADAPTER',
    default: AI_DEFAULT_ADAPTER_NAME,
    showInDocumentation: false,
  },
  defaultModelId: {
    doc: 'Default AI model to use when no specific model is specified, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b". The adapterId can be omitted, like "llama3.1:8b", in which case the default adapter will be used.',
    schema: aiModelIdSchema,
    env: AI_DEFAULT_MODEL_ENV_KEY,
    default: 'unknown',
    showInDocumentation: false,
  },
} as const satisfies AppConfigDefinition;
