import type { AppConfigDefinition } from '../../config/config.types';
import * as v from 'valibot';
import { mistralOcrConfig } from './content-extraction-strategies/mistral-ocr/mistral-ocr.content-extraction-strategy.config';
import {
  CONTENT_EXTRACTION_STRATEGIES,
  CONTENT_EXTRACTION_STRATEGY_NAMES,
} from './content-extraction-strategies/content-extraction-strategies.constants';
import { doclingConfig } from './content-extraction-strategies/docling/docling.content-extraction-strategy.config';
import { azureDiConfig } from './content-extraction-strategies/azure-di/azure-di.content-extraction-strategy.config';
import { customHttpConfig } from './content-extraction-strategies/custom-http/custom-http.content-extraction-strategy.config';

export const documentContentExtractionConfig = {
  extractionStrategies: {
    doc: [
      `Content extraction strategy, it can be a single strategy name like \`${CONTENT_EXTRACTION_STRATEGIES.internal}\`, or a comma-separated list of strategy names, in order of preference, like \`${[CONTENT_EXTRACTION_STRATEGIES.mistralOcr, CONTENT_EXTRACTION_STRATEGIES.internal].join(',')}\`. The first strategy that can extract text from the document will be used, and if a strategy fails processing a document, the next one will try. Available strategies are:`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.internal}\`: Uses the internal \`lecture\` library to extract text from documents, which support all common document formats and uses Tesseract for OCR. This strategy is always available, great to use as a fallback when other strategies fail.`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.mistralOcr}\`: Uses the Mistral OCR API to extract text from documents. This strategy requires a valid Mistral API key.`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.docling}\`: Uses a Docling server to extract text from documents. This strategy requires a running [Docling server](https://github.com/docling-project/docling-serve).`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.azureDi}\`: Uses the Azure Document Intelligence service to extract text from documents. This strategy requires a valid Azure Document Intelligence endpoint and API key.`,
      `- \`${CONTENT_EXTRACTION_STRATEGIES.customHttp}\`: Uses a custom HTTP service to extract text from documents. This makes a POST request to the configured URL with the document file, see \`CONTENT_EXTRACTION_CUSTOM_HTTP_\` environment variables for configuration.`,
    ].join('\n'),
    schema: v.pipe(
      v.string(),
      v.transform((value) => value.split(',').map((s) => s.trim())),
      v.array(v.picklist(CONTENT_EXTRACTION_STRATEGY_NAMES)),
      v.minLength(1, 'At least one content extraction strategy must be specified.'),
    ),
    env: 'CONTENT_EXTRACTION_STRATEGY',
    default: CONTENT_EXTRACTION_STRATEGIES.internal,
  },
  strategy: {
    mistralOcr: mistralOcrConfig,
    docling: doclingConfig,
    azureDi: azureDiConfig,
    customHttp: customHttpConfig,
  },
} as const satisfies AppConfigDefinition;
