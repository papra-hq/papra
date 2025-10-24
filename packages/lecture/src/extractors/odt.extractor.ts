import { XMLParser } from 'fast-xml-parser';
import { defineTextExtractor } from '../extractors.models';
import { getFileContentFromArchive } from '../utils/archive';

export const odtExtractorDefinition = defineTextExtractor({
  name: 'odt',
  mimeTypes: [
    'application/vnd.oasis.opendocument.text',
  ],
  extract: async ({ arrayBuffer }) => {
    const contentXml = await getFileContentFromArchive({ arrayBuffer, filePath: 'content.xml' });

    if (!contentXml) {
      return { content: '' };
    }

    // Parse XML and extract text nodes
    const parsed: unknown = new XMLParser({
      ignoreAttributes: true,
      isArray: () => false,
      textNodeName: '#text',
    }).parse(contentXml);

    // Extract text from the parsed XML structure
    const text = extractTextFromOdt(parsed);

    return { content: text };
  },
});

function extractTextFromOdt(parsed: unknown): string {
  // ODT text is in office:document-content > office:body > office:text
  // Text is in various elements like text:p (paragraphs), text:h (headings), etc.

  const paragraphs: string[] = [];

  function extractTextFromNode(obj: unknown): string {
    const texts: string[] = [];

    function traverse(node: unknown): void {
      if (node === null || node === undefined) {
        return;
      }

      if (typeof node === 'string') {
        const trimmed = node.trim();
        if (trimmed) {
          texts.push(trimmed);
        }
        return;
      }

      if (Array.isArray(node)) {
        node.forEach(traverse);
        return;
      }

      if (typeof node === 'object') {
        // Handle text nodes
        const nodeObj = node as Record<string, unknown>;
        if (nodeObj['#text']) {
          const trimmed = String(nodeObj['#text']).trim();
          if (trimmed) {
            texts.push(trimmed);
          }
        }

        // Traverse all other properties
        Object.keys(nodeObj).forEach((key) => {
          if (key !== '#text') {
            traverse(nodeObj[key]);
          }
        });
      }
    }

    traverse(obj);
    return texts.join(' ').replace(/\s+/g, ' ').trim();
  }

  function findParagraphs(obj: unknown): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach(findParagraphs);
      return;
    }

    if (typeof obj === 'object') {
      const nodeObj = obj as Record<string, unknown>;

      // Check if this object has paragraph or heading arrays
      if (nodeObj['text:p'] !== undefined) {
        const paragraphData = nodeObj['text:p'];

        // Handle both single paragraph and array of paragraphs
        const paragraphArray = Array.isArray(paragraphData) ? paragraphData : [paragraphData];

        paragraphArray.forEach((para) => {
          const text = extractTextFromNode(para);
          if (text) {
            paragraphs.push(text);
          }
        });
      }

      if (nodeObj['text:h'] !== undefined) {
        const headingData = nodeObj['text:h'];

        // Handle both single heading and array of headings
        const headingArray = Array.isArray(headingData) ? headingData : [headingData];

        headingArray.forEach((heading) => {
          const text = extractTextFromNode(heading);
          if (text) {
            paragraphs.push(text);
          }
        });
      }

      // Continue searching for paragraphs in other properties
      Object.keys(nodeObj).forEach((key) => {
        if (key !== 'text:p' && key !== 'text:h') {
          findParagraphs(nodeObj[key]);
        }
      });
    }
  }

  findParagraphs(parsed);

  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
}
