import type { Config } from '../../../config/config.types';

export type ContentExtractionStrategy = {
  canExtractTextFromDocument: (args: { file: File }) => Promise<boolean>;
  extractTextFromDocument: (args: {
    file: File;
    ocrLanguages?: string[];
  }) => Promise<{ text: string; extractionContext?: Record<string, unknown> }>;
};

export type ContentExtractionStrategyFactory = (args: {
  config: Config;
}) => ContentExtractionStrategy;
