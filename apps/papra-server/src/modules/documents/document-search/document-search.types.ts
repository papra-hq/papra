export type DocumentSearchServices = {
  name: string;
  searchDocuments: (args: {
    searchQuery: string;
    organizationId: string;
    pageIndex: number;
    pageSize: number;
  }) => Promise<{ searchResults: { documents: { id: string; name: string }[] } }>;
};
