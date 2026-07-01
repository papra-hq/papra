import * as v from 'valibot';
import type { AppConfigDefinition } from '../../../../config/config.types';

export const mistralOcrConfig = {
  modelName: {
    doc: 'The name of the Mistral OCR model to use for text extraction.',
    env: 'MISTRAL_OCR_MODEL_NAME',
    schema: v.string(),
    default: 'mistral-ocr-latest',
  },
  mimeTypesAllowList: {
    doc: 'The list of mime types that the Mistral OCR strategy will be used for. If the document mime type is not in this list, the strategy will be skipped. Comma separated list. Supports wildcards, e.g. "image/*" matches all image mime types, and "*" matches all formats. Prefix an entry with "!" to negate it, e.g. "*,!image/png" allows everything except PNG. Negations always take precedence over allows, even more specific ones (e.g. "image/png,!image/*" rejects PNG).',
    env: 'MISTRAL_OCR_MIME_TYPES_ALLOW_LIST',
    schema: v.pipe(
      v.string(),
      v.transform(
        (value) =>
          new Set(
            value
              .split(',')
              .map((s) => s.trim().toLowerCase())
              .filter(Boolean),
          ),
      ),
    ),
    default: 'application/pdf,image/*',
  },
} as const satisfies AppConfigDefinition;
