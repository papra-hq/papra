import type { Document } from './documents.types';

export type DocumentEvents = {
  'document.created': { document: Document };
  'documents.trashed': { documentIds: string[]; organizationId: string; trashedBy: string }; // Soft deleted by moving to trash
  'document.restored': { documentId: string; organizationId: string; restoredBy: string };
  'document.updated': {
    userId?: string;
    document: Document;
    changes: {
      name?: string;
      content?: string;
      notes?: string;
    };
  };
  'document.moved': {
    userId?: string;
    document: Document;
    sourceOrganizationId: string;
    targetOrganizationId: string;
  };
  'document.deleted': { documentId: string; organizationId: string }; // Hard deleted from trash
  // Tags added to and/or removed from one or more documents in a single operation.
  // Pairs only include changes that actually happened (idempotent no-ops are excluded).
  'document.tags.changed': {
    organizationId: string;
    userId?: string;
    addedPairs: { documentId: string; tagId: string; tagName: string }[];
    removedPairs: { documentId: string; tagId: string; tagName: string }[];
  };
};
