export type Document = {
  id: string;
  organizationId: string;
  name: string;
  mimeType: string;
  originalSize: number;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
};
