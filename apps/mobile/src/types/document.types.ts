export type Document = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  size: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
};

export type DocumentList = {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
};
