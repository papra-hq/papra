import type { AppConfigDefinition } from '../config/config.types';
import { booleanishSchema } from '../config/config.schemas';

export const autoDocumentDateConfig = {
  isEnabled: {
    doc: 'Whether AI document date extraction can be used in the application. Organization needs to enable it in their settings. Needs to enable global AI features too, with `AI_IS_ENABLED`. It runs in the same AI request as auto-tagging and auto-naming and uses the auto-tagging model.',
    schema: booleanishSchema,
    env: 'AUTO_DOCUMENT_DATE_ENABLED',
    default: true,
  },
} as const satisfies AppConfigDefinition;
