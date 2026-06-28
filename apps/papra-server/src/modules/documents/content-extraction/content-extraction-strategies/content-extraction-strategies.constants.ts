export const CONTENT_EXTRACTION_STRATEGIES = {
  internal: 'internal',
  mistralOcr: 'mistral-ocr',
} as const;

export const CONTENT_EXTRACTION_STRATEGY_NAMES = Object.values(CONTENT_EXTRACTION_STRATEGIES);
export type ContentExtractionStrategyName = (typeof CONTENT_EXTRACTION_STRATEGY_NAMES)[number];
