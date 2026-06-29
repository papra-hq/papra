import * as v from 'valibot';
import type { AppConfigDefinition } from '../../../../config/config.types';
import { urlSchema } from '../../../../config/config.schemas';

export const doclingConfig = {
  baseUrl: {
    doc: 'The base URL of the Docling service.',
    env: 'DOCLING_BASE_URL',
    schema: urlSchema,
    default: 'http://localhost:5001',
  },
  apiKey: {
    doc: 'The API key for the Docling service, will be set as `X-API-Key` header in requests to the Docling service, can be configured on docling side using the `DOCLING_SERVE_API_KEY` environment variable.',
    env: 'DOCLING_API_KEY',
    schema: v.optional(v.string()),
    default: undefined,
  },
  mimeTypesAllowList: {
    doc: 'The list of mime types that the Docling strategy will be used for. If the document mime type is not in this list, the strategy will be skipped. Comma separated list. Supports wildcards, e.g. "image/*" matches all image mime types, and "*" matches all formats. Prefix an entry with "!" to negate it, e.g. "*,!image/png" allows everything except PNG. Negations always take precedence over allows, even more specific ones (e.g. "image/png,!image/*" rejects PNG).',
    env: 'DOCLING_MIME_TYPES_ALLOW_LIST',
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
    default: '*',
  },
} as const satisfies AppConfigDefinition;
