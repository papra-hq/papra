import type { Logger, PartialExtractorConfig } from './types';
import { parseConfig } from './config';
import { getExtractor } from './extractors.registry';

export async function extractText({ arrayBuffer, mimeType, config: rawConfig, logger }: { arrayBuffer: ArrayBuffer; mimeType: string; config?: PartialExtractorConfig; logger?: Logger }): Promise<{
  extractorName: string | undefined;
  extractorType: string | undefined;
  textContent: string | undefined;
  error?: Error;
  subExtractorsUsed: string[];
}> {
  const { config } = parseConfig({ rawConfig });
  const { extractor } = getExtractor({ mimeType });

  if (!extractor) {
    logger?.warn({ mimeType }, 'No extractor found');

    return {
      extractorName: undefined,
      extractorType: undefined,
      textContent: undefined,
      subExtractorsUsed: [],
    };
  }

  const extractorName = extractor.name;

  try {
    logger?.debug({ extractorName, mimeType }, 'Starting extraction');
    const startTime = Date.now();
    const { content, subExtractorsUsed } = await extractor.extract({ arrayBuffer, config, logger });
    const duration = Date.now() - startTime;
    const extractorType = [extractorName, ...subExtractorsUsed ?? []].join(':');

    logger?.info({ extractorName, extractorType, mimeType, durationMs: duration }, 'Extraction completed');

    return {
      extractorName,
      extractorType,
      textContent: content,
      subExtractorsUsed,
    };
  } catch (error) {
    return {
      error,
      extractorName,
      extractorType: undefined,
      textContent: undefined,
      subExtractorsUsed: [],
    };
  }
}

export async function extractTextFromBlob({ blob, ...rest }: { blob: Blob; config?: PartialExtractorConfig; logger?: Logger }) {
  const arrayBuffer = await blob.arrayBuffer();
  const mimeType = blob.type;

  return extractText({ arrayBuffer, mimeType, ...rest });
}

export async function extractTextFromFile({ file, ...rest }: { file: File; config?: PartialExtractorConfig; logger?: Logger }) {
  return extractTextFromBlob({ blob: file, ...rest });
}
