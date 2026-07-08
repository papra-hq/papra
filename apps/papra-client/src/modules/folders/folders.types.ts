export type Folder = {
  id: string;
  organizationId: string;
  parentId: string | null;
  name: string;
  documentsCount?: number;
  createdAt: Date;
  updatedAt: Date;
};
