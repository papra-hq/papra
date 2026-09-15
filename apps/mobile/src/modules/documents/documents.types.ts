import type { Tag } from '../tags/tags.types';

export type DocumentCustomProperty = {
  key: string;
  name: string;
  type: string;
  displayOrder: number;
  value: unknown;
};

export type Document = {
  id: string;
  name: string;
  mimeType: string;
  originalSize: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  localUri: string | undefined;
  notes?: string | null;
  customProperties?: DocumentCustomProperty[];
  tags: Tag[];
};
