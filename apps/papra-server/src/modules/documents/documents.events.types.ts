import type { Document } from './documents.types';

export type DocumentEvents = {
  'document.created': { document: Document };
  'document.trashed': { documentId: string; organizationId: string; trashedBy: string }; // Soft deleted by moving to trash
  'document.restored': { documentId: string; organizationId: string; restoredBy: string };
  'document.updated': {
    userId?: string;
    document: Document;
    changes: {
      name?: string;
      content?: string;
    };
  };
  'document.deleted': { documentId: string; organizationId: string }; // Hard deleted from trash
};
