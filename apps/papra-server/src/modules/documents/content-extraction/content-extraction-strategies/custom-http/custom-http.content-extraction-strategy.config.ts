import * as v from 'valibot';
import type { AppConfigDefinition } from '../../../../config/config.types';
import { urlSchema } from '../../../../config/config.schemas';
import { headersDefinitionStringSchema } from '../../../../shared/schemas/headers.schemas';
import {
  RESPONSE_FORMAT,
  RESPONSE_FORMATS,
  UPLOAD_FORMAT,
  UPLOAD_FORMATS,
} from './custom-http.content-extraction-strategy.constants';
import { coercedStrictlyPositiveIntegerSchema } from '../../../../shared/schemas/number.schemas';
import { IN_MS } from '../../../../shared/units';

export const customHttpConfig = {
  url: {
    doc: 'The URL of the Custom HTTP service.',
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_URL',
    schema: v.optional(urlSchema),
    default: undefined,
  },
  headers: {
    doc: 'Custom headers to include in requests to the Custom HTTP service. Content-type header will be automatically set based on the uploadFormat, so it should not be included in this list. The headers should be specified as a JSON object, e.g. `{"Authorization": "Bearer <token>"}`.',
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_HEADERS',
    schema: headersDefinitionStringSchema,
    default: '{}',
  },
  uploadFormat: {
    doc: [
      'The format in which the document will be uploaded to the Custom HTTP service. Available formats are:',
      `- \`${UPLOAD_FORMAT.FORM_DATA}\`: The document will be uploaded as a multipart/form-data request, with the document file in the "file" field.`,
      `- \`${UPLOAD_FORMAT.JSON}\`: The document will be uploaded as a JSON request, with the document file base64-encoded: \`{ document: { "filename": "file.pdf", "type": "application/pdf", "content": "<base64-encoded-content>" } }\`.`,
    ].join('\n'),
    schema: v.picklist(UPLOAD_FORMATS),
    default: UPLOAD_FORMAT.FORM_DATA,
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_UPLOAD_FORMAT',
  },
  requestTimeout: {
    doc: 'The timeout in milliseconds for requests to the Custom HTTP service.',
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_REQUEST_TIMEOUT_MS',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 30 * IN_MS.SECOND,
  },
  responseFormat: {
    doc: [
      'The format in which the response from the Custom HTTP service will be interpreted. Available formats are:',
      `- \`${RESPONSE_FORMAT.JSON}\`: The response will be interpreted as JSON, and the text will be extracted from the path specified in \`jsonResponseTextPath\`.`,
      `- \`${RESPONSE_FORMAT.TEXT}\`: The response will be interpreted as plain text, and the entire response body will be used as the extracted text.`,
    ].join('\n'),
    schema: v.picklist(RESPONSE_FORMATS),
    default: RESPONSE_FORMAT.JSON,
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_RESPONSE_FORMAT',
  },
  jsonResponseTextPath: {
    doc: '',
    schema: v.pipe(
      v.string(),
      v.transform((value) =>
        value
          .split('.')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
      v.pipe(
        v.array(v.string()),
        v.minLength(1, 'The jsonResponseTextPath must contain at least one path segment.'),
      ),
    ),
    default: 'text',
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_JSON_RESPONSE_TEXT_PATH',
  },
  mimeTypesAllowList: {
    doc: 'The list of mime types that the Custom HTTP strategy will be used for. If the document mime type is not in this list, the strategy will be skipped. Comma separated list. Supports wildcards, e.g. "image/*" matches all image mime types, and "*" matches all formats. Prefix an entry with "!" to negate it, e.g. "*,!image/png" allows everything except PNG. Negations always take precedence over allows, even more specific ones (e.g. "image/png,!image/*" rejects PNG).',
    env: 'CONTENT_EXTRACTION_CUSTOM_HTTP_MIME_TYPES_ALLOW_LIST',
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
