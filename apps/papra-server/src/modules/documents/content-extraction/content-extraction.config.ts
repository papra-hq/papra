import type { AppConfigDefinition } from '../../config/config.types';
import * as v from 'valibot';
import { mistralOcrConfig } from './content-extraction-strategies/mistral-ocr/mistral-ocr.content-extraction-strategy.config';
import {
  CONTENT_EXTRACTION_STRATEGIES,
  CONTENT_EXTRACTION_STRATEGY_NAMES,
} from './content-extraction-strategies/content-extraction-strategies.constants';

export const documentContentExtractionConfig = {
  extractionStrategies: {
    doc: [
      `Content extraction strategy, it can be a single strategy name like \`${CONTENT_EXTRACTION_STRATEGIES.internal}\`, or a comma-separated list of strategy names, in order of preference, like \`${[CONTENT_EXTRACTION_STRATEGIES.mistralOcr, CONTENT_EXTRACTION_STRATEGIES.internal].join(',')}\`. The first strategy that can extract text from the document will be used, and if a strategy fails processing a document, the next one will try. Available strategies are:`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.internal}\`: Uses the internal \`lecture\` library to extract text from documents, which support all common document formats and uses Tesseract for OCR. This strategy is always available, great to use as a fallback when other strategies fail.`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.mistralOcr}\`: Uses the Mistral OCR API to extract text from documents. This strategy requires a valid Mistral API key.`,
    ].join('\n'),
    schema: v.pipe(
      v.string(),
      v.transform((value) => value.split(',').map((s) => s.trim())),
      v.array(v.picklist(CONTENT_EXTRACTION_STRATEGY_NAMES)),
      v.minLength(1, 'At least one content extraction strategy must be specified.'),
    ),
    env: 'CONTENT_EXTRACTION_STRATEGY',
    default: CONTENT_EXTRACTION_STRATEGIES.internal,
    showInDocumentation: false,
  },
  strategy: {
    mistralOcr: mistralOcrConfig,
  },
} as const satisfies AppConfigDefinition;
