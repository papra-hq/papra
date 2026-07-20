import { ofetch } from 'ofetch';
import * as v from 'valibot';
import { buildDocumentInfo } from './mistral-ocr.content-extraction-strategy.models';

const ocrResponseSchema = v.object({
  pages: v.array(
    v.object({
      markdown: v.string(),
    }),
  ),
  usage_info: v.object({
    pages_processed: v.pipe(v.number(), v.safeInteger()),
  }),
});

export async function extractTextWithMistralOcr({
  file,
  modelName,
  baseUrl,
  apiKey,
  timeoutMs,
}: {
  file: File;

  modelName: string;
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/ocr`;

  const response = await ofetch<unknown>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: timeoutMs,
    body: JSON.stringify({
      model: modelName,
      include_image_base64: false,
      include_blocks: false,
      // From the doc https://docs.mistral.ai/studio-api/document-processing/basic_ocr :
      // Table formatting can be toggled between null , markdown and html via the table_format parameter.
      // - null : Tables are returned inline as markdown within the extracted page.
      // - markdown : Tables are returned as markdown tables separately.
      // - html : Tables are returned as html tables separately.
      table_format: null, // We want tables to be returned inline as markdown within the extracted page.
      document: await buildDocumentInfo({ file }),
    }),
  });

  const parsedResponse = v.parse(ocrResponseSchema, response);

  const text = parsedResponse.pages.map((page) => page.markdown).join('\n\n');

  return {
    text,
    processedPagesCount: parsedResponse.usage_info.pages_processed,
  };
}
