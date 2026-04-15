import type { Document } from '../documents/documents.types';

export function getDocumentFieldValue({ document, field }: { document: Document; field: string }) {
  const fieldValue: unknown = Object.hasOwn(document, field) ? document[field as keyof Document] : undefined;

  return { fieldValue: String(fieldValue ?? '') };
}
