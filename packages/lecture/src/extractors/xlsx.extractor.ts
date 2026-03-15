import { XMLParser } from 'fast-xml-parser';
import JSZip from 'jszip';
import { defineTextExtractor } from '../extractors.models';

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

// <t> elements can have attributes (e.g. xml:space="preserve"), in which case
// fast-xml-parser returns an object with '#text' rather than a plain string.
function extractTText(t: unknown): string {
  if (t == null) {
    return '';
  }
  if (typeof t !== 'object') {
    return String(t);
  }
  const obj = t as XmlNode;
  return obj['#text'] != null ? String(obj['#text']) : '';
}

export const xlsxExtractorDefinition = defineTextExtractor({
  name: 'xlsx',
  mimeTypes: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  extract: async ({ arrayBuffer }) => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', textNodeName: '#text', isArray: () => false });

    // Load shared strings (may not exist in all xlsx files)
    const sharedStrings: string[] = [];
    const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('text');
    if (sharedStringsXml) {
      const parsed = asNode(parser.parse(sharedStringsXml));
      const sst = asNode(parsed?.sst);
      for (const si of asArray(sst?.si)) {
        sharedStrings.push(extractSharedString(si));
      }
    }

    // Resolve sheet targets from xl/_rels/workbook.xml.rels to handle non-contiguous sheet numbering
    const rIdToTarget: Record<string, string> = {};
    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('text');
    if (relsXml) {
      const rels = asNode(parser.parse(relsXml));
      const relationships = asNode(rels?.Relationships);
      for (const rel of asArray(relationships?.Relationship)) {
        const relNode = asNode(rel);
        if (!relNode) {
          continue;
        }
        const id = relNode['@_Id'] as string | undefined;
        const target = relNode['@_Target'] as string | undefined;
        const type = relNode['@_Type'] as string | undefined;
        if (id && target && type?.endsWith('/worksheet')) {
          rIdToTarget[id] = target.startsWith('xl/') ? target : `xl/${target}`;
        }
      }
    }

    // Determine sheet order from workbook.xml, resolving actual targets via rels
    const sheetPaths: string[] = [];
    const workbookXml = await zip.file('xl/workbook.xml')?.async('text');
    if (workbookXml) {
      const workbook = asNode(parser.parse(workbookXml));
      const wb = asNode(workbook?.workbook);
      const sheets = asNode(wb?.sheets);
      for (const sheetRaw of asArray(sheets?.sheet)) {
        const sheet = asNode(sheetRaw);
        const rId = sheet?.['@_r:id'] as string | undefined;
        const target = rId ? rIdToTarget[rId] : undefined;
        if (target) {
          sheetPaths.push(target);
        }
      }
    }

    // Fallback: discover sheets from zip if rels resolution yielded nothing
    if (sheetPaths.length === 0) {
      Object.keys(zip.files)
        .filter(name => name.match(/^xl\/worksheets\/sheet\d+\.xml$/))
        .sort((a, b) => {
          const numA = Number.parseInt(a.match(/sheet(\d+)\.xml$/)?.[1] ?? '0', 10);
          const numB = Number.parseInt(b.match(/sheet(\d+)\.xml$/)?.[1] ?? '0', 10);
          return numA - numB;
        })
        .forEach(name => sheetPaths.push(name));
    }

    const sheets: string[] = [];

    for (const sheetPath of sheetPaths) {
      const sheetXml = await zip.file(sheetPath)?.async('text');
      if (!sheetXml) {
        continue;
      }

      const parsed = asNode(parser.parse(sheetXml));
      const worksheet = asNode(parsed?.worksheet);
      const sheetData = asNode(worksheet?.sheetData);
      const rows = asArray(sheetData?.row);

      const rowTexts: string[] = [];

      for (const rowRaw of rows) {
        const row = asNode(rowRaw);
        const cells = asArray(row?.c);
        const cellTexts: string[] = [];

        for (const cellRaw of cells) {
          const cell = asNode(cellRaw);
          if (!cell) {
            continue;
          }

          const cellType = cell['@_t'] as string | undefined;
          const value = cell.v;
          const inlineStr = asNode(cell.is);

          let text = '';

          if (cellType === 's' && value != null) {
            // shared string reference
            text = sharedStrings[Number(value)] ?? '';
          } else if (cellType === 'inlineStr' && inlineStr) {
            text = extractSharedString(inlineStr);
          } else if (cellType === 'str' && value != null) {
            // formula result string
            text = String(value);
          } else if (value != null) {
            text = String(value);
          }

          if (text.trim()) {
            cellTexts.push(text.trim());
          }
        }

        if (cellTexts.length > 0) {
          rowTexts.push(cellTexts.join('\t'));
        }
      }

      if (rowTexts.length > 0) {
        sheets.push(rowTexts.join('\n'));
      }
    }

    return { content: sheets.join('\n\n') };
  },
});

function extractSharedString(si: unknown): string {
  const siObj = asNode(si);
  if (!siObj) {
    return '';
  }

  // Simple string: <si><t>text</t></si>
  if (siObj.t != null) {
    return extractTText(siObj.t);
  }

  // Rich text: <si><r><t>text</t></r>...</si>
  return asArray(siObj.r)
    .map((r) => {
      const rObj = asNode(r);
      return rObj?.t != null ? extractTText(rObj.t) : '';
    })
    .join('');
}
