import type { Config } from '../../../config/config.types';
import type { Logger } from '../../../shared/logger/logger';

export type ContentExtractionStrategy = {
  canExtractTextFromDocument: (args: { file: File }) => Promise<boolean>;
  extractTextFromDocument: (args: {
    file: File;
    ocrLanguages?: string[];
    logger?: Logger;
  }) => Promise<{ text: string; extractionContext?: Record<string, unknown> }>;
};

export type ContentExtractionStrategyFactory = (args: {
  config: Config;
}) => ContentExtractionStrategy;
