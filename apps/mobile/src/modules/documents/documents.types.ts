export type Document = {
  id: string;
  name: string;
  mimeType: string;
  originalSize: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  localUri: string | undefined;
  tags: {
    id: string;
    name: string;
    color: string;
  }[];
};
