import { ofetch } from 'ofetch';
import * as v from 'valibot';
import { buildDocumentInfo } from './mistral-ocr.content-extraction-strategy.models';
import { IN_MS } from '../../../../shared/units';

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
}: {
  file: File;

  modelName: string;
  baseUrl: string;
  apiKey: string;
}) {
  const url = `${baseUrl.replace(/\/$/, '')}/ocr`;

  const response = await ofetch<unknown>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    timeout: 30 * IN_MS.SECOND,
    body: JSON.stringify({
      model: modelName,
      include_image_base64: false,
      include_blocks: false,
      table_format: 'markdown',
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
