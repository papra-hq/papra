import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { defineTextExtractor } from '../extractors.models';

export const pptxExtractorDefinition = defineTextExtractor({
  name: 'pptx',
  mimeTypes: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  extract: async ({ arrayBuffer }) => {
    // PPTX files are ZIP archives containing XML files
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find all slide files
    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = Number.parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
        const numB = Number.parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || '0', 10);
        return numA - numB;
      });

    const slides: string[] = [];

    for (const slideFile of slideFiles) {
      const slideXml = await zip.file(slideFile)?.async('text');

      if (!slideXml) {
        continue;
      }

      // Parse XML and extract text nodes
      const parser = new XMLParser({
        ignoreAttributes: true,
        isArray: () => false,
        textNodeName: '#text',
      });

      const parsed: unknown = parser.parse(slideXml);

      // Extract text from the slide
      const slideText = extractTextFromSlide(parsed);
      if (slideText) {
        slides.push(slideText);
      }
    }

    // Join slides with triple newlines to separate them
    return { content: slides.join('\n\n\n') };
  },
});

function extractTextFromSlide(parsed: unknown): string {
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
        const nodeObj = node as Record<string, unknown>;

        // Handle text nodes
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

  const paragraphs: string[] = [];

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

      // Check if this object has paragraph elements (a:p in PowerPoint XML)
      if (nodeObj['a:p'] !== undefined) {
        const paragraphData = nodeObj['a:p'];

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
        if (key !== 'a:p') {
          findParagraphs(nodeObj[key]);
        }
      });
    }
  }

  findParagraphs(parsed);

  // Join paragraphs with double newlines
  return paragraphs.join('\n\n');
}
