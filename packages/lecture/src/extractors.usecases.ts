import type { PartialExtractorConfig } from './types';
import { parseConfig } from './config';
import { getExtractor } from './extractors.registry';

export async function extractText({ arrayBuffer, mimeType, config: rawConfig }: { arrayBuffer: ArrayBuffer; mimeType: string; config?: PartialExtractorConfig }): Promise<{
  extractorName: string | undefined;
  extractorType: string | undefined;
  textContent: string | undefined;
  error?: Error;
  subExtractorsUsed: string[];
}> {
  const { config } = parseConfig({ rawConfig });
  const { extractor } = getExtractor({ mimeType });

  if (!extractor) {
    return {
      extractorName: undefined,
      extractorType: undefined,
      textContent: undefined,
      subExtractorsUsed: [],
    };
  }

  try {
    const { content, subExtractorsUsed } = await extractor.extract({ arrayBuffer, config });

    return {
      extractorName: extractor.name,
      extractorType: [extractor.name, ...subExtractorsUsed ?? []].join(':'),
      textContent: content,
      subExtractorsUsed,
    };
  } catch (error) {
    return {
      error,
      extractorName: extractor.name,
      extractorType: undefined,
      textContent: undefined,
      subExtractorsUsed: [],
    };
  }
}

export async function extractTextFromBlob({ blob, config }: { blob: Blob; config?: PartialExtractorConfig }) {
  const arrayBuffer = await blob.arrayBuffer();
  const mimeType = blob.type;

  return extractText({ arrayBuffer, mimeType, config });
}

export async function extractTextFromFile({ file, config }: { file: File; config?: PartialExtractorConfig }) {
  return extractTextFromBlob({ blob: file, config });
}
