import { XMLParser } from 'fast-xml-parser';
import { defineTextExtractor } from '../extractors.models';
import { getFileContentFromArchive } from '../utils/archive';

export const docExtractorDefinition = defineTextExtractor({
  name: 'doc',
  mimeTypes: [
    // Note: Only .docx (XML-based) format is supported
    // Legacy .doc (binary) format is not supported by this in-house implementation
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  extract: async ({ arrayBuffer }) => {
    const documentXml = await getFileContentFromArchive({ arrayBuffer, filePath: 'word/document.xml' });

    if (!documentXml) {
      return { content: '' };
    }

    // Parse XML and extract text nodes
    const parsed: unknown = new XMLParser({
      ignoreAttributes: true,
      isArray: () => false,
      textNodeName: '#text',
    }).parse(documentXml);

    // Extract text from the parsed XML structure
    const text = extractTextFromDocx(parsed);

    return { content: text };
  },
});

function extractTextFromDocx(parsed: unknown): string {
  // DOCX text is in w:document > w:body > w:p (paragraphs) > w:r (runs) > w:t (text)
  // We extract text from each paragraph separately to preserve structure

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

      // Check if this object has paragraph arrays
      if (nodeObj['w:p'] !== undefined) {
        const paragraphData = nodeObj['w:p'];

        // Handle both single paragraph and array of paragraphs
        const paragraphArray = Array.isArray(paragraphData) ? paragraphData : [paragraphData];

        paragraphArray.forEach((para) => {
          const text = extractTextFromNode(para);
          if (text) {
            paragraphs.push(text);
          }
        });
      }

      // Continue searching for paragraphs in other properties
      Object.keys(nodeObj).forEach((key) => {
        if (key !== 'w:p') {
          findParagraphs(nodeObj[key]);
        }
      });
    }
  }

  findParagraphs(parsed);

  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
}
