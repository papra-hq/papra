import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';
import { extractTextFromDocumentWithCustomHttp } from './custom-http.content-extraction-strategy.usecases';
import { isNilOrEmptyString } from '../../../../shared/utils';

export function buildCustomHttpContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const {
    url,
    headers,
    uploadFormat,
    responseFormat,
    jsonResponseTextPath,
    requestTimeout,
    mimeTypesAllowList,
  } = config.documentContentExtraction.strategy.customHttp;

  return {
    canExtractTextFromDocument: async ({ file }) => {
      return (
        !isNilOrEmptyString(url) &&
        isMimeTypeAllowed({
          mimeType: file.type,
          allowList: mimeTypesAllowList,
        })
      );
    },

    extractTextFromDocument: async ({ file }) => {
      if (!url) {
        throw new Error('Custom HTTP URL is not configured.');
      }

      const { text } = await extractTextFromDocumentWithCustomHttp({
        file,
        url,
        headers,
        uploadFormat,
        responseFormat,
        requestTimeout,
        jsonResponseTextPath,
      });

      return { text };
    },
  };
}
