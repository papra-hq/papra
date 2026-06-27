import { ofetch } from 'ofetch';
import { fileToBase64DataUrl } from '../../../shared/files/files';
import * as v from 'valibot';

const ocrResponseSchema = v.object({
  pages: v.array(
    v.object({
      markdown: v.string(),
    }),
  ),
});

async function buildDocumentInfo({ file }: { file: File }) {
  const isImage = file.type.startsWith('image/');
  const dataUrl = await fileToBase64DataUrl(file);

  if (isImage) {
    return {
      type: 'image_url',
      image_url: dataUrl,
    };
  }

  return {
    type: 'document_url',
    document_url: dataUrl,
  };
}

export async function runOcr({
  file,
  modelName,
  baseUrl,
  apiKey,
}: {
  file: File;

  modelName: string;
  baseUrl: string;
  apiKey: string;
}): Promise<{ text: string }> {
  const url = `${baseUrl.replace(/\/$/, '')}/ocr`;

  const response = await ofetch.raw<unknown>(url, {
    method: 'POST',
    headers: {
      'Concent-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      include_image_base64: false,
      include_blocks: false,
      table_format: 'markdown',
      document: await buildDocumentInfo({ file }),
    }),
  });

  if (response.status !== 200) {
    throw new Error(`OCR request failed with status ${response.status}`);
  }

  const responseData = await response.json();

  const parsedResponse = v.parse(ocrResponseSchema, responseData);

  const text = parsedResponse.pages.map((page) => page.markdown).join('\n\n');

  return { text };
}
