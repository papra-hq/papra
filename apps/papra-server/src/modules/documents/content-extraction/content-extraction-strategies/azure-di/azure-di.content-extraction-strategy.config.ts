import * as v from 'valibot';
import type { AppConfigDefinition } from '../../../../config/config.types';
import { urlSchema } from '../../../../config/config.schemas';
import { coercedStrictlyPositiveIntegerSchema } from '../../../../shared/schemas/number.schemas';
import { IN_MS } from '../../../../shared/units';

export const azureDiConfig = {
  endpoint: {
    doc: 'The endpoint of the Azure Document Intelligence service.',
    env: 'AZURE_DI_ENDPOINT',
    schema: v.optional(urlSchema),
    default: undefined,
  },
  apiKey: {
    doc: 'The API key for the Azure Document Intelligence service, will be set as `Ocp-Apim-Subscription-Key` header in requests to the Azure Document Intelligence service.',
    env: 'AZURE_DI_API_KEY',
    schema: v.string(),
    default: '',
  },
  timeoutMs: {
    doc: 'The timeout in milliseconds for requests to the Azure Document Intelligence service.',
    env: 'AZURE_DI_REQUEST_TIMEOUT_MS',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 5 * IN_MS.MINUTE,
  },
  mimeTypesAllowList: {
    doc: 'The list of mime types that the Azure Document Inteligence strategy will be used for. If the document mime type is not in this list, the strategy will be skipped. Comma separated list. Supports wildcards, e.g. "image/*" matches all image mime types, and "*" matches all formats. Prefix an entry with "!" to negate it, e.g. "*,!image/png" allows everything except PNG. Negations always take precedence over allows, even more specific ones (e.g. "image/png,!image/*" rejects PNG).',
    env: 'AZURE_DI_MIME_TYPES_ALLOW_LIST',
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
  pollingAttempts: {
    doc: 'The number of attempts to poll the Azure Document Intelligence service for the result of a document processing job.',
    env: 'AZURE_DI_POLLING_ATTEMPTS',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 10,
  },
  pollingDelayMs: {
    doc: 'The delay in milliseconds between polling attempts to the Azure Document Intelligence service for the result of a document processing job.',
    env: 'AZURE_DI_POLLING_DELAY_MS',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 2000,
  },
} as const satisfies AppConfigDefinition;
