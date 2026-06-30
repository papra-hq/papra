import type {
  ResponseFormat,
  UploadFormat,
} from './custom-http.content-extraction-strategy.constants';
import { ofetch } from 'ofetch';
import {
  buildRequestBody,
  extractTextFromResponse,
} from './custom-http.content-extraction-strategy.models';

export async function extractTextFromDocumentWithCustomHttp({
  file,
  url,
  headers,
  uploadFormat,
  responseFormat,
  requestTimeout,
  jsonResponseTextPath,
}: {
  file: File;
  url: string;
  headers: Record<string, string>;
  uploadFormat: UploadFormat;
  requestTimeout: number;
  responseFormat: ResponseFormat;
  jsonResponseTextPath: string[];
}): Promise<{ text: string }> {
  const requestBody = await buildRequestBody({ uploadFormat, file });

  const response = await ofetch(url, {
    method: 'POST',
    headers,
    body: requestBody,
    responseType: responseFormat === 'json' ? 'json' : 'text',
    timeout: requestTimeout,
  });

  const { text } = extractTextFromResponse({
    response,
    responseFormat,
    jsonResponseTextPath,
  });

  return { text };
}
