import { aiModelIdSchema } from './ai.schemas';
import { booleanishSchema } from '../config/config.schemas';
import type { AppConfigDefinition } from '../config/config.types';
import * as v from 'valibot';
import { AI_DEFAULT_MODEL_ENV_KEY } from './ai.constants';
import { openAiAdaptersConfig } from './adapters/openai-compatible/openai-compatible.config';
import { anthropicAdaptersConfig } from './adapters/anthropic/anthropic.ai-adapters.config';

export const aiConfig = {
  isEnabled: {
    doc: 'Whether AI features are enabled',
    schema: booleanishSchema,
    env: 'AI_IS_ENABLED',
    default: false,
  },
  adapters: {
    anthropic: anthropicAdaptersConfig,
    ...openAiAdaptersConfig,
  },
  defaultModelId: {
    doc: 'Default AI model to use when no specific model is specified, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b".',
    schema: v.optional(aiModelIdSchema),
    env: AI_DEFAULT_MODEL_ENV_KEY,
    default: undefined,
  },
} as const satisfies AppConfigDefinition;
