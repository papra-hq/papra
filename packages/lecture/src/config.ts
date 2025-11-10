import type { ExtractorConfig, PartialExtractorConfig } from './types';
import { languages as tesseractLanguages } from 'tesseract.js';

export const ocrLanguages = Object.values(tesseractLanguages);

export function parseConfig({ rawConfig = {} }: { rawConfig?: PartialExtractorConfig } = {}): { config: ExtractorConfig } {
  const languages = rawConfig.tesseract?.languages ?? [];
  const invalidLanguages = languages.filter(language => !ocrLanguages.includes(language));

  if (invalidLanguages.length > 0) {
    throw new Error(`Invalid languages for tesseract: ${invalidLanguages.join(', ')}. Valid languages are: ${ocrLanguages.join(', ')}`);
  }

  return {
    config: {
      ...(rawConfig ?? {}),
      tesseract: {
        ...(rawConfig.tesseract ?? {}),
        languages: languages.length > 0 ? languages : ['eng'],
      },
    },
  };
}
