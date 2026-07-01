import { fileToBase64 } from '../../../../shared/files/files';
import type {
  ResponseFormat,
  UploadFormat,
} from './custom-http.content-extraction-strategy.constants';

export async function buildRequestBody({
  uploadFormat,
  file,
}: {
  uploadFormat: UploadFormat;
  file: File;
}) {
  if (uploadFormat === 'form-data') {
    const formData = new FormData();
    formData.append('file', file);
    return formData;
  } else if (uploadFormat === 'json') {
    return {
      document: {
        filename: file.name,
        type: file.type,
        content: await fileToBase64(file),
      },
    };
  }

  throw new Error('Unsupported upload format.');
}

export function extractTextFromResponse({
  response,
  responseFormat,
  jsonResponseTextPath,
}: {
  response: unknown;
  responseFormat: ResponseFormat;
  jsonResponseTextPath: string[];
}): { text: string } {
  if (responseFormat === 'text') {
    if (typeof response !== 'string') {
      throw new Error(`Expected response to be a string, but got ${typeof response}`);
    }
    return { text: response };
  } else if (responseFormat === 'json') {
    if (typeof response !== 'object' || response === null) {
      throw new Error(`Expected response to be an object, but got ${typeof response}`);
    }

    let current: unknown = response;

    for (const key of jsonResponseTextPath) {
      if (
        typeof current !== 'object' ||
        current === null ||
        !Object.prototype.hasOwnProperty.call(current, key)
      ) {
        throw new Error(`Expected response to have key ${key}.`);
      }
      current = (current as Record<string, unknown>)[key];
    }

    if (typeof current !== 'string') {
      throw new Error(`Expected response to be a string, but got ${typeof current}`);
    }

    return { text: current };
  }

  throw new Error('Unsupported response format');
}
