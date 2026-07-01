import type { Config } from '../../../../config/config.types';
import type { ContentExtractionStrategy } from '../content-extraction-strategies.types';
import { isMimeTypeAllowed } from '../../../../shared/mime-types/mime-types.models';
import { extractTextWithAzureDi } from './azure-di.content-extraction-strategy.usecases';
import { isNilOrEmptyString } from '../../../../shared/utils';

export function buildAzureDiContentExtractionStrategy({
  config,
}: {
  config: Config;
}): ContentExtractionStrategy {
  const { endpoint, apiKey, mimeTypesAllowList, pollingAttempts, pollingDelayMs } =
    config.documentContentExtraction.strategy.azureDi;

  return {
    canExtractTextFromDocument: async ({ file }) => {
      return (
        !isNilOrEmptyString(endpoint) &&
        !isNilOrEmptyString(apiKey) &&
        isMimeTypeAllowed({
          mimeType: file.type,
          allowList: mimeTypesAllowList,
        })
      );
    },

    extractTextFromDocument: async ({ file }) => {
      if (isNilOrEmptyString(endpoint)) {
        throw new Error('Azure DI endpoint is not configured');
      }

      const { text } = await extractTextWithAzureDi({
        file,
        endpoint,
        apiKey,
        pollingAttempts,
        pollingDelayMs,
      });

      return { text };
    },
  };
}
