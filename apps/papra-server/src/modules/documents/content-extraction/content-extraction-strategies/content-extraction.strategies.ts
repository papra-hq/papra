import { buildLectureContentExtractionStrategy } from './lecture/lecture.content-extraction-strategy';
import { buildMistralOcrContentExtractionStrategy } from './mistral-ocr/mistral-ocr.content-extraction-strategy';

export const strategiesRegistry = {
  'internal': buildLectureContentExtractionStrategy,
  'mistral-ocr': buildMistralOcrContentExtractionStrategy,
};

export function getContentExtractionStrategy({ strategyName }: { strategyName: string }) {
  const strategyBuilder = strategiesRegistry[strategyName as keyof typeof strategiesRegistry];

  if (!strategyBuilder) {
    throw new Error(`Content extraction strategy "${strategyName}" is not registered.`);
  }

  return strategyBuilder;
}
