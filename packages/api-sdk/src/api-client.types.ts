export type PapraDocument = {
  id: string;
  name: string;
  mimeType: string;
  originalName: string;
  originalSize: number;
  originalStorageKey: string;
  originalSha256Hash: string;
  organizationId: string;
  createdBy: string;
  deletedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  isDeleted: boolean;
  content: string;
};

export type PapraTag = {
  id: string;
  name: string;
  color: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};
