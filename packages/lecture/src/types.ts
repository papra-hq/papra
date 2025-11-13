import type { DeepPartial } from '@corentinth/chisels';

export type ExtractorConfig = {
  tesseract: {
    languages: string[];
    forceJs?: boolean;
    binary?: string;
  };
};

export type PartialExtractorConfig = undefined | DeepPartial<ExtractorConfig>;

export type Logger = {
  debug: (...args: [data: Record<string, unknown>, message: string] | [message: string]) => void;
  info: (...args: [data: Record<string, unknown>, message: string] | [message: string]) => void;
  warn: (...args: [data: Record<string, unknown>, message: string] | [message: string]) => void;
  error: (...args: [data: Record<string, unknown>, message: string] | [message: string]) => void;
};
