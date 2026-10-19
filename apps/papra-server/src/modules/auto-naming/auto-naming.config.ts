import * as v from 'valibot';
import type { AppConfigDefinition } from '../config/config.types';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';
import { booleanishSchema } from '../config/config.schemas';

export const autoNamingConfig = {
  isEnabled: {
    doc: 'Whether AI auto-naming can be used in the application. Organization needs to enable it in their settings. Needs to enable global AI features too, with `AI_IS_ENABLED`. Auto-naming runs in the same AI request as auto-tagging and uses the auto-tagging model.',
    schema: booleanishSchema,
    env: 'AUTO_NAMING_ENABLED',
    default: true,
  },
  maxTitleLength: {
    doc: 'The maximum number of characters that can be used in an AI-generated document title (capped at 255, the document name limit).',
    schema: v.pipe(coercedStrictlyPositiveIntegerSchema, v.maxValue(255)),
    env: 'AUTO_NAMING_MAX_TITLE_LENGTH',
    default: 120,
  },
} as const satisfies AppConfigDefinition;
