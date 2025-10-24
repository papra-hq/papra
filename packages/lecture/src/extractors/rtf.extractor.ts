import rtfParser from 'rtf-parser';
import { defineTextExtractor } from '../extractors.models';

export const rtfExtractorDefinition = defineTextExtractor({
  name: 'rtf',
  mimeTypes: [
    'text/rtf',
    'application/rtf',
  ],
  extract: async ({ arrayBuffer }) => {
    const text = new TextDecoder().decode(arrayBuffer);

    // Parse RTF using rtf-parser
    const doc = await new Promise<any>((resolve, reject) => {
      rtfParser.string(text, (err: Error | null, parsedDoc: any) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(parsedDoc);
      });
    });

    // Extract text from the parsed RTF document
    const extractedText = extractTextFromRtf(doc);

    return { content: extractedText };
  },
});

function extractTextFromRtf(doc: any): string {
  function extractTextFromNode(node: any): string {
    const texts: string[] = [];

    function traverse(item: any): void {
      if (!item) {
        return;
      }

      // If this node has a value (text content), add it
      if (typeof item.value === 'string') {
        texts.push(item.value);
      }

      // If this node has content (children), recursively process them
      if (Array.isArray(item.content)) {
        item.content.forEach(traverse);
      }
    }

    traverse(node);
    return texts.join('').trim();
  }

  const paragraphs: string[] = [];

  // Extract text from each top-level content block (typically corresponds to paragraphs/sections)
  if (doc.content && Array.isArray(doc.content)) {
    for (const contentBlock of doc.content) {
      const text = extractTextFromNode(contentBlock);
      if (text) {
        paragraphs.push(text);
      }
    }
  }

  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
}
