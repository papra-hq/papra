import type { ContentExtractionStrategyName } from './content-extraction-strategies.constants';
import type { ContentExtractionStrategyFactory } from './content-extraction-strategies.types';
import { buildDoclingContentExtractionStrategy } from './docling/docling.content-extraction-strategy';
import { buildLectureContentExtractionStrategy } from './lecture/lecture.content-extraction-strategy';
import { buildMistralOcrContentExtractionStrategy } from './mistral-ocr/mistral-ocr.content-extraction-strategy';

export const strategiesRegistry = {
  'internal': buildLectureContentExtractionStrategy,
  'mistral-ocr': buildMistralOcrContentExtractionStrategy,
  'docling': buildDoclingContentExtractionStrategy,
} satisfies Record<ContentExtractionStrategyName, ContentExtractionStrategyFactory>;

export function getContentExtractionStrategy({ strategyName }: { strategyName: string }) {
  const strategyBuilder = strategiesRegistry[strategyName as keyof typeof strategiesRegistry];

  if (!strategyBuilder) {
    throw new Error(`Content extraction strategy "${strategyName}" is not registered.`);
  }

  return strategyBuilder;
}
