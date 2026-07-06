import * as v from 'valibot';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from '../ai/ai.constants';
import { aiModelIdSchema } from '../ai/ai.schemas';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { booleanishSchema } from '../config/config.schemas';

export const autoTaggingConfig = {
  isEnabled: {
    doc: 'Whether AI auto-tagging can be used in the application. Organization needs to enable it in their settings. Needs to enable global AI features too, with `AI_IS_ENABLED`.',
    schema: booleanishSchema,
    env: 'AUTO_TAGGING_ENABLED',
    default: true,
  },
  modelId: {
    doc: 'AI model to use for auto-tagging, the format is <adapterId>://<modelName>, e.g. "ollama://llama3.1:8b", where the <adapterId> is the id of the adapter defined in the AI_ADAPTERS env variable.',
    schema: v.optional(aiModelIdSchema),
    env: ['AUTO_TAGGING_MODEL', AI_DEFAULT_MODEL_ENV_KEY],
    default: undefined,
  },
  defaultMaxTags: {
    doc: 'The default maximum number of tags that can be assigned by AI auto-tagging. This can be overridden per organization in the organization settings.',
    schema: coercedStrictlyPositiveIntegerSchema,
    env: 'AUTO_TAGGING_DEFAULT_MAX_TAGS',
    default: 5,
  },
} as const satisfies AppConfigDefinition;
