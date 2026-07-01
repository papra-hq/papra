import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';
import { extractTextWithDoclingServer } from './docling.content-extraction-strategy.usecases';

export function buildDoclingContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const { baseUrl, apiKey, mimeTypesAllowList } = config.documentContentExtraction.strategy.docling;

  return {
    canExtractTextFromDocument: async ({ file }) => {
      return isMimeTypeAllowed({
        mimeType: file.type,
        allowList: mimeTypesAllowList,
      });
    },

    extractTextFromDocument: async ({ file }) => {
      const { text } = await extractTextWithDoclingServer({
        file,
        baseUrl,
        apiKey,
      });

      return { text };
    },
  };
}
