export type DocumentView = {
  id: string;
  name: string;
  query: string;
  description?: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};
