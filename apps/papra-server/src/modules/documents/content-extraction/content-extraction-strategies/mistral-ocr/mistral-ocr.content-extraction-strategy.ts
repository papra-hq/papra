import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { extractTextWithMistralOcr } from './mistral-ocr.content-extraction-strategy.usecases';
import { isMistralOcrAbleToExtractTextFromDocument } from './mistral-ocr.content-extraction-strategy.models';
import { isNilOrEmptyString } from '../../../../shared/utils';

export function buildMistralOcrContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const { modelName, mimeTypesAllowList } = config.documentContentExtraction.strategy.mistralOcr;
  const { baseUrl, apiKey } = config.ai.adapters.mistral;

  return {
    name: 'mistral-ocr',
    canExtractTextFromDocument: async ({ file }) => {
      if (isNilOrEmptyString(apiKey)) {
        return false;
      }

      return isMistralOcrAbleToExtractTextFromDocument({ file, mimeTypesAllowList });
    },
    extractTextFromDocument: async ({ file }) => {
      const { text, processedPagesCount } = await extractTextWithMistralOcr({
        file,
        modelName,
        baseUrl,
        apiKey,
      });

      return { text, extractionContext: { processedPagesCount } };
    },
  };
}
