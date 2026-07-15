import { ofetch } from 'ofetch';
import * as v from 'valibot';
import { stripDoclingImagePlaceholders } from './docling.content-extraction-strategy.models';

export const doclingResponseSchema = v.object({
  status: v.literal('success'),
  document: v.object({
    md_content: v.string(),
  }),
});

export async function extractTextWithDoclingServer({
  file,
  baseUrl,
  apiKey,
  timeoutMs,
}: {
  file: File;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/convert/file`;

  const body = new FormData();
  body.append('files', file);
  body.append('to_formats', 'md');
  body.append('image_export_mode', 'placeholder');

  const response = await ofetch<unknown>(url, {
    method: 'POST',
    headers: {
      // 'Content-Type': 'multipart/form-data',
      ...(apiKey ? { 'X-Api-Key': apiKey } : {}),
    },
    timeout: timeoutMs,
    body,
  });

  const parsedResponse = v.parse(doclingResponseSchema, response);

  const text = stripDoclingImagePlaceholders(parsedResponse.document.md_content);

  return {
    text,
  };
}
