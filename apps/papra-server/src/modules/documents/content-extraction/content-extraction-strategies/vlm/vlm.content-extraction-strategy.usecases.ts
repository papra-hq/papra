import type { AiServices } from '../../../../ai/ai.services';
import { fileToBase64 } from '../../../../shared/files/files';

export async function extractTextWithVlm({
  file,
  modelId,
  aiServices,
  organizationId,
}: {
  file: File;
  modelId: string;
  organizationId: string;
  aiServices: AiServices;
}) {
  const dataUrl = await fileToBase64(file);
  const documentType = file.type.startsWith('image/') ? 'image' : 'document';

  const text = await aiServices.generateStructuredData({
    modelId,
    organizationId,
    source: 'content-extraction',
    userPrompt: [
      {
        type: 'text',
        content: `Extract the text from the document. Return only the extracted text, without any additional formatting or explanation.`,
      },
      {
        type: documentType,
        source: {
          type: 'data',
          mimeType: file.type,
          value: dataUrl,
        },
      },
    ],
  });

  return {
    text,
  };
}
