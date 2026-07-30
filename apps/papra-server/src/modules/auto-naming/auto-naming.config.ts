import * as v from 'valibot';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from '../ai/ai.constants';
import { aiModelIdSchema } from '../ai/ai.schemas';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { booleanishSchema } from '../config/config.schemas';

export const autoNamingConfig = {
  isEnabled: {
    doc: 'Whether AI auto-naming can be used in the application. Organization needs to enable it in their settings. Needs to enable global AI features too, with `AI_IS_ENABLED`.',
    schema: booleanishSchema,
    env: 'AUTO_NAMING_ENABLED',
    default: true,
  },
  modelId: {
    doc: 'AI model to use for auto-naming, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b", where the <adapterId> is the id of the adapter defined in the AI_ADAPTERS env variable.',
    schema: v.optional(aiModelIdSchema),
    env: ['AUTO_NAMING_MODEL', AI_DEFAULT_MODEL_ENV_KEY],
    default: undefined,
  },
  maxTitleLength: {
    doc: 'The maximum number of characters that can be used in an AI-generated document title (capped at 255, the document name limit).',
    schema: v.pipe(coercedStrictlyPositiveIntegerSchema, v.maxValue(255)),
    env: 'AUTO_NAMING_MAX_TITLE_LENGTH',
    default: 120,
  },
} as const satisfies AppConfigDefinition;
