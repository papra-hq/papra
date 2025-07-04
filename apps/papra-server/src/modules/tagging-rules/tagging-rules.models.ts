import type { Document } from '../documents/documents.types';
import { get } from 'lodash-es';

export function getDocumentFieldValue({ document, field }: { document: Document; field: string }) {
  const fieldValue: unknown = get(document, field);

  return { fieldValue: String(fieldValue ?? '') };
}
