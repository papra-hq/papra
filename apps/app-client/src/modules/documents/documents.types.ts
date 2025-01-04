export type Document = {
  id: string;
  organizationId: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  updatedAt?: Date;
};
