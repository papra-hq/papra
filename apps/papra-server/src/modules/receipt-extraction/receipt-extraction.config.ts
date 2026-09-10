import * as v from 'valibot';
import type { AppConfigDefinition } from '../config/config.types';
import { AI_DEFAULT_MODEL_ENV_KEY } from '../ai/ai.constants';
import { aiModelIdSchema } from '../ai/ai.schemas';
import { booleanishSchema } from '../config/config.schemas';
import { DEFAULT_RECEIPT_CATEGORIES } from './receipt-extraction.constants';

const coercedStringListSchema = v.union([
  v.pipe(v.array(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255))), v.minLength(1)),
  v.pipe(
    v.string(),
    v.transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
    v.array(v.pipe(v.string(), v.maxLength(255))),
    v.minLength(1),
  ),
]);

export const receiptExtractionConfig = {
  isEnabled: {
    doc: 'Whether AI receipt extraction runs after content extraction. Detects receipts and invoices and fills vendor, date, total, tax, currency, payment method and category custom properties. Needs global AI features enabled with `AI_IS_ENABLED`.',
    schema: booleanishSchema,
    env: 'RECEIPT_EXTRACTION_ENABLED',
    default: false,
  },
  modelId: {
    doc: 'AI model used for receipt extraction, format <adapterId>://<modelName>, e.g. "anthropic://claude-haiku-4-5". Falls back to AI_DEFAULT_MODEL.',
    schema: v.optional(aiModelIdSchema),
    env: ['RECEIPT_EXTRACTION_MODEL', AI_DEFAULT_MODEL_ENV_KEY],
    default: undefined,
  },
  categories: {
    doc: 'Comma separated list of expense categories the AI can pick from. Synced to the "Expense category" select property.',
    schema: coercedStringListSchema,
    env: 'RECEIPT_EXTRACTION_CATEGORIES',
    default: [...DEFAULT_RECEIPT_CATEGORIES],
  },
  tagName: {
    doc: 'Tag applied to documents detected as receipts, created if missing. Set to an empty string to disable tagging.',
    schema: v.pipe(v.string(), v.trim(), v.maxLength(255)),
    env: 'RECEIPT_EXTRACTION_TAG_NAME',
    default: 'Receipt',
  },
  overwriteExistingValues: {
    doc: 'When false, fields that already have a value on the document (for example set manually) are left untouched.',
    schema: booleanishSchema,
    env: 'RECEIPT_EXTRACTION_OVERWRITE_EXISTING_VALUES',
    default: false,
  },
} as const satisfies AppConfigDefinition;
