import { XMLParser } from 'fast-xml-parser';
import { defineTextExtractor } from '../extractors.models';
import { getFileContentFromArchive } from '../utils/archive';

export const odpExtractorDefinition = defineTextExtractor({
  name: 'odp',
  mimeTypes: [
    'application/vnd.oasis.opendocument.presentation',
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

    // Extract text from the parsed ODP document
    const text = extractTextFromOdp(parsed);

    return { content: text };
  },
});

function extractTextFromOdp(parsed: unknown): string {
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

  const slides: string[] = [];

  function extractSlides(obj: unknown): void {
    if (obj === null || obj === undefined) {
      return;
    }

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      const nodeObj = obj as Record<string, unknown>;

      // Check if this object has page elements (draw:page in ODP)
      if (nodeObj['draw:page'] !== undefined) {
        const pageData = nodeObj['draw:page'];

        // Handle both single page and array of pages
        const pageArray = Array.isArray(pageData) ? pageData : [pageData];

        pageArray.forEach((page) => {
          const slideText = extractTextFromSlide(page);
          if (slideText) {
            slides.push(slideText);
          }
        });
      }

      // Continue searching for pages in other properties
      Object.keys(nodeObj).forEach((key) => {
        if (key !== 'draw:page') {
          extractSlides(nodeObj[key]);
        }
      });
    }
  }

  function extractTextFromSlide(slide: unknown): string {
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

        // Check if this object has paragraph elements (text:p in ODP)
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

        // Continue searching for paragraphs in other properties
        Object.keys(nodeObj).forEach((key) => {
          if (key !== 'text:p') {
            findParagraphs(nodeObj[key]);
          }
        });
      }
    }

    findParagraphs(slide);

    // Join paragraphs with double newlines
    return paragraphs.join('\n\n');
  }

  extractSlides(parsed);

  // Join slides with triple newlines to separate them
  return slides.join('\n\n\n');
}
