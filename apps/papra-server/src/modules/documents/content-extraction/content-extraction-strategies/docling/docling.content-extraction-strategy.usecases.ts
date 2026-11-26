import type { FetchOptions } from 'ofetch';
import * as v from 'valibot';
import {
  buildDoclingRequestBody,
  stripDoclingImagePlaceholders,
} from './docling.content-extraction-strategy.models';

export const doclingResponseSchema = v.object({
  status: v.literal('success'),
  document: v.object({
    md_content: v.string(),
  }),
});

export function buildExtractTextWithDoclingServer({
  baseUrl,
  apiKey,
  timeoutMs,
  options,
  request,
}: {
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
  options: Record<string, unknown>;
  request: (url: string, options: FetchOptions<'json'>) => Promise<unknown>;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/convert/file`;

  return async ({ file }: { file: File }) => {
    const body = buildDoclingRequestBody({ file, options });

    const response = await request(url, {
      method: 'POST',
      headers: {
        ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
      },
      timeout: timeoutMs,
      body,
    });

    const parsedResponse = v.parse(doclingResponseSchema, response);

    const text = stripDoclingImagePlaceholders(parsedResponse.document.md_content);

    return { text };
  };
}
