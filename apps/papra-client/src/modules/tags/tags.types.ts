export type Tag = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  documentsCount: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};
