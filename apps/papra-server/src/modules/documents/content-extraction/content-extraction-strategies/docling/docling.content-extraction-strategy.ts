import { ofetch } from 'ofetch';
import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';
import { buildExtractTextWithDoclingServer } from './docling.content-extraction-strategy.usecases';

export function buildDoclingContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const { baseUrl, apiKey, mimeTypesAllowList, timeoutMs, options } =
    config.documentContentExtraction.strategy.docling;

  const extractTextWithDoclingServer = buildExtractTextWithDoclingServer({
    baseUrl,
    apiKey,
    timeoutMs,
    options,
    request: ofetch,
  });

  return {
    canExtractTextFromDocument: async ({ file }) => {
      return isMimeTypeAllowed({
        mimeType: file.type,
        allowList: mimeTypesAllowList,
      });
    },

    extractTextFromDocument: extractTextWithDoclingServer,
  };
}
