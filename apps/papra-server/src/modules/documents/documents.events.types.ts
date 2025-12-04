import type { Document } from './documents.types';

export type DocumentEvents = {
  'document.created': { document: Document };
  'document.trashed': { documentId: string; organizationId: string; trashedBy: string }; // Soft deleted by moving to trash
};
