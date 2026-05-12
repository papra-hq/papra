import type { Document } from '../documents.types';
import type { DocumentSearchSort } from './document-search.constants';

export type DocumentSearchableData = {
  id: string;
  name: string;
  content: string;
  isDeleted: boolean;
  organizationId: string;
};

export type DocumentSearchResult = {
  documents: Omit<Document, 'content'>[];
  documentsCount: number;
};

export type DocumentUpdate = {
  documentId: string;
  document: Partial<Omit<DocumentSearchableData, 'id'>>;
};

export type DocumentSearchServices = {
  name: string;
  searchDocuments: (args: {
    searchQuery: string;
    organizationId: string;
    pageIndex: number;
    pageSize: number;
    sort?: DocumentSearchSort;
  }) => Promise<DocumentSearchResult>;

  getDocumentIdsMatchingQuery: (args: {
    searchQuery: string;
    organizationId: string;
  }) => Promise<{ documentIds: string[] }>;

  indexDocuments: (args: { documents: DocumentSearchableData[] }) => Promise<void>;
  updateDocuments: (args: { updates: DocumentUpdate[] }) => Promise<void>;
  deleteDocuments: (args: { documentIds: string[] }) => Promise<void>;
};
