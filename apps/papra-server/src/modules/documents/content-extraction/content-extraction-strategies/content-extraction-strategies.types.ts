export type ContentExtractionStrategy = {
  name: string;
  canExtractTextFromDocument: (args: { file: File }) => Promise<boolean>;
  extractTextFromDocument: (args: {
    file: File;
    ocrLanguages?: string[];
  }) => Promise<{ text: string; extractionContext?: Record<string, unknown> }>;
};
