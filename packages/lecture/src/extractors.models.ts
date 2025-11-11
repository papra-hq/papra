import type { ExtractorConfig } from './types';

export type ExtractorDefinition = ReturnType<typeof defineTextExtractor>;

export function defineTextExtractor(args: {
  name: string;
  mimeTypes: string[];
  extract: (args: { arrayBuffer: ArrayBuffer; config: ExtractorConfig }) => Promise<{ content: string; subExtractorsUsed?: string[] }>;
}) {
  return args;
}
