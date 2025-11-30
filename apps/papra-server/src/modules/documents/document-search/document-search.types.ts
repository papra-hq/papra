export type DocumentSearchableData = {
  id: string;
  name: string;
  originalName: string;
  content: string;
  isDeleted: boolean;
  organizationId: string;
};

export type DocumentSearchServices = {
  name: string;
  searchDocuments: (args: {
    searchQuery: string;
    organizationId: string;
    pageIndex: number;
    pageSize: number;
  }) => Promise<{ searchResults: { documents: { id: string; name: string }[] } }>;

  indexDocument: (args: { document: DocumentSearchableData }) => Promise<void>;
  updateDocument: (args: { documentId: string; document: Partial<Omit<DocumentSearchableData, 'id'>> }) => Promise<void>;
  deleteDocument: (args: { documentId: string }) => Promise<void>;
};
