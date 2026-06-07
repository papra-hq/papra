import type { CustomPropertyType } from '@papra/app-server/customProperties/constants';

export {
  CustomPropertyType,
};

export type DocumentCustomProperty = {
  key: string;
  name: string;
  type: CustomPropertyType;
  displayOrder: number;
  value: unknown;
};

export type CustomPropertySelectOption = {
  id: string;
  name: string;
  key: string;
  displayOrder: number;
};

export type CustomPropertyDefinition = {
  id: string;
  organizationId: string;
  name: string;
  key: string;
  description?: string | null;
  type: CustomPropertyType;
  displayOrder: number;
  options: CustomPropertySelectOption[];
  createdAt: Date;
  updatedAt: Date;
};
