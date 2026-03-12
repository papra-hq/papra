import type { DocumentPropertyValueForApi } from '../../custom-properties/custom-properties.types';
import type { Tag } from '../../tags/tags.types';
import type { Document } from '../documents.types';

export type DocumentSearchableData = {
  id: string;
  name: string;
  originalName: string;
  content: string;
  isDeleted: boolean;
  organizationId: string;
};

export type DocumentWithRelations = Omit<Document, 'content'> & {
  tags: Tag[];
  propertyValues: DocumentPropertyValueForApi[];
};

export type DocumentSearchServices = {
  name: string;
  searchDocuments: (args: {
    searchQuery: string;
    organizationId: string;
    pageIndex: number;
    pageSize: number;
  }) => Promise<{ documents: DocumentWithRelations[]; documentsCount: number }>;

  indexDocument: (args: { document: DocumentSearchableData }) => Promise<void>;
  updateDocument: (args: { documentId: string; document: Partial<Omit<DocumentSearchableData, 'id'>> }) => Promise<void>;
  deleteDocument: (args: { documentId: string }) => Promise<void>;
};
