import type { ExtractorDefinition } from './extractors.models';
import { docExtractorDefinition } from './extractors/doc.extractor';
import { imageExtractorDefinition } from './extractors/img.extractor';
import { odpExtractorDefinition } from './extractors/odp.extractor';
import { odtExtractorDefinition } from './extractors/odt.extractor';
import { pdfExtractorDefinition } from './extractors/pdf.extractor';
import { pptxExtractorDefinition } from './extractors/pptx.extractor';
import { rtfExtractorDefinition } from './extractors/rtf.extractor';
import { txtExtractorDefinition } from './extractors/txt.extractor';

export const extractorDefinitions: ExtractorDefinition[] = [
  pdfExtractorDefinition,
  rtfExtractorDefinition,
  txtExtractorDefinition,
  imageExtractorDefinition,
  docExtractorDefinition,
  pptxExtractorDefinition,
  odtExtractorDefinition,
  odpExtractorDefinition,
];

export function getExtractor({
  mimeType,
  extractors = extractorDefinitions,
}: {
  mimeType: string;
  extractors?: ExtractorDefinition[];
}) {
  const wilcardedMimeType = mimeType.replace(/\/.*/, '/*');
  const extractor = extractors.find(extractor => extractor.mimeTypes.includes(mimeType) || extractor.mimeTypes.includes(wilcardedMimeType));

  return {
    extractor,
  };
}
