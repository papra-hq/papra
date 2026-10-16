import * as v from 'valibot';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from '../ai/ai.constants';
import { aiModelIdSchema } from '../ai/ai.schemas';
import { booleanishSchema } from '../config/config.schemas';

export const aiExtractionConfig = {
  isEnabled: {
    doc: 'Whether AI document extraction can be used in the application. Organizations need to enable it in their settings. Needs to enable global AI features too, with `AI_IS_ENABLED`.',
    schema: booleanishSchema,
    env: 'AI_EXTRACTION_ENABLED',
    default: true,
  },
  modelId: {
    doc: 'AI model to use for document extraction (date, custom properties, and filename), the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b", where the <adapterId> is the id of the adapter defined in the AI_ADAPTERS env variable.',
    schema: v.optional(aiModelIdSchema),
    env: ['AI_EXTRACTION_MODEL', AI_DEFAULT_MODEL_ENV_KEY],
    default: undefined,
  },
} as const satisfies AppConfigDefinition;
