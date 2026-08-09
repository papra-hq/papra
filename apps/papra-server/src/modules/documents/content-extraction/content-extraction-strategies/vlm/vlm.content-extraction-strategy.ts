import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { extractTextWithMistralOcr } from './vlm.content-extraction-strategy.usecases';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';

export function buildVlmContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const { modelName, mimeTypesAllowList } = config.documentContentExtraction.strategy.vlm;

  return {
    canExtractTextFromDocument: async ({ file }) => {
      return isMimeTypeAllowed({
        mimeType: file.type,
        allowList: mimeTypesAllowList,
      });
    },

    extractTextFromDocument: async ({ file }) => {
      const { text, processedPagesCount } = await extractTextWithVlm({
        file,
        modelName,
        baseUrl,
        apiKey,
        timeoutMs,
      });

      return { text, extractionContext: { processedPagesCount } };
    },
  };
}
