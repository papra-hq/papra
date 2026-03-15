import { XMLParser } from 'fast-xml-parser';
import { defineTextExtractor } from '../extractors.models';
import { getFileContentFromArchive } from '../utils/archive';

type XmlNode = Record<string, unknown>;

function asNode(value: unknown): XmlNode | undefined {
  if (value != null && typeof value === 'object' && !Array.isArray(value)) {
    return value as XmlNode;
  }
  return undefined;
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value != null) {
    return [value];
  }
  return [];
}

// Recursively extract all text content from a parsed XML node,
// handling nested elements like text:span and arrays of paragraphs.
function extractText(node: unknown): string {
  if (node == null) {
    return '';
  }
  if (typeof node !== 'object') {
    return String(node).trim();
  }
  if (Array.isArray(node)) {
    return node.map(extractText).filter(Boolean).join(' ');
  }
  const obj = node as XmlNode;
  const parts: string[] = [];
  if (obj['#text'] != null) {
    const t = String(obj['#text']).trim();
    if (t) {
      parts.push(t);
    }
  }
  for (const key of Object.keys(obj)) {
    if (key !== '#text') {
      const child = extractText(obj[key]);
      if (child) {
        parts.push(child);
      }
    }
  }
  return parts.join(' ');
}

export const odsExtractorDefinition = defineTextExtractor({
  name: 'ods',
  mimeTypes: [
    'application/vnd.oasis.opendocument.spreadsheet',
  ],
  extract: async ({ arrayBuffer }) => {
    const contentXml = await getFileContentFromArchive({ arrayBuffer, filePath: 'content.xml' });

    if (!contentXml) {
      return { content: '' };
    }

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', isArray: () => false });
    const parsed = asNode(parser.parse(contentXml));

    // Navigate to office:spreadsheet
    const docContent = asNode(parsed?.['office:document-content']);
    const body = asNode(docContent?.['office:body']);
    const spreadsheet = asNode(body?.['office:spreadsheet']);
    const tables = asArray(spreadsheet?.['table:table']);

    const sheetTexts: string[] = [];

    for (const tableRaw of tables) {
      const table = asNode(tableRaw);
      const rows = asArray(table?.['table:table-row']);
      const rowTexts: string[] = [];

      for (const rowRaw of rows) {
        const row = asNode(rowRaw);
        const cells = asArray(row?.['table:table-cell']);
        const cellTexts: string[] = [];

        for (const cellRaw of cells) {
          const cell = asNode(cellRaw);
          if (!cell) {
            continue;
          }

          // text:p can be a primitive, object, or array of paragraphs (each possibly with nested spans)
          const text = asArray(cell['text:p']).map(extractText).filter(Boolean).join(' ');

          if (text) {
            cellTexts.push(text);
          }
        }

        if (cellTexts.length > 0) {
          rowTexts.push(cellTexts.join('\t'));
        }
      }

      if (rowTexts.length > 0) {
        sheetTexts.push(rowTexts.join('\n'));
      }
    }

    return { content: sheetTexts.join('\n\n') };
  },
});
