import type { Document } from '../documents.types';

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
  }) => Promise<DocumentSearchResult>;

  indexDocuments: (args: { documents: DocumentSearchableData[] }) => Promise<void>;
  updateDocuments: (args: { updates: DocumentUpdate[] }) => Promise<void>;
  deleteDocuments: (args: { documentIds: string[] }) => Promise<void>;
};
