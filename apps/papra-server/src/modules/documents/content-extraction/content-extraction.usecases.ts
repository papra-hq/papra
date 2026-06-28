import { createLogger } from '../../shared/logger/logger';
import type { Logger } from '../../shared/logger/logger';
import type { Config } from '../../config/config.types';
import { getContentExtractionStrategy } from './content-extraction-strategies/content-extraction.strategies';
import { castError } from '@corentinth/chisels';
import { createNoStrategyAbleToExtractTextError } from './content-extraction.errors';

export type ExtractDocumentTextUsecase = (args: { file: File }) => Promise<{ text: string }>;

export function buildExtractDocumentTextUsecase({
  ocrLanguages,
  config,
  logger = createLogger({ namespace: 'extract-document-text-usecase' }),
}: {
  ocrLanguages?: string[];
  config: Config;
  logger?: Logger;
}) {
  return async ({ file }: { file: File }) => {
    const { extractionStrategies } = config.documentContentExtraction;
    const errors: Error[] = [];

    for (const strategyName of extractionStrategies) {
      const strategyFactory = getContentExtractionStrategy({ strategyName });
      const strategy = strategyFactory({ config });

      try {
        const canExtract = await strategy.canExtractTextFromDocument({ file });

        if (!canExtract) {
          logger.debug(`Strategy ${strategyName} cannot extract text from document, skipping.`);
          continue;
        }

        logger.debug(`Using strategy ${strategyName} to extract text from document`);

        const startingTime = Date.now();
        const { text, extractionContext } = await strategy.extractTextFromDocument({
          file,
          ocrLanguages,
        });
        const durationMs = Date.now() - startingTime;

        logger.info(
          {
            durationMs,
            strategyName,
            fileSize: file.size,
            fileType: file.type,
            ...extractionContext,
          },
          'Extracted text from document',
        );

        return { text };
      } catch (error) {
        logger.error(
          {
            strategyName,
            fileSize: file.size,
            fileType: file.type,
            error,
          },
          'Error extracting text from document',
        );
        errors.push(castError(error));
      }
    }

    if (errors.length === 0) {
      throw createNoStrategyAbleToExtractTextError();
    }

    throw new AggregateError(
      errors,
      'All content extraction strategies failed to extract text from document',
    );
  };
}
