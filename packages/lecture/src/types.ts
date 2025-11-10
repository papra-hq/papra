import type { DeepPartial } from '@corentinth/chisels';

export type ExtractorConfig = {
  tesseract: {
    languages: string[];
    forceJs?: boolean;
    binary?: string;
  };
};

export type PartialExtractorConfig = undefined | DeepPartial<ExtractorConfig>;
