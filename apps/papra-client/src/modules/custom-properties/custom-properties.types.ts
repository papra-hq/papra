export type CustomPropertyType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select' | 'user_relation' | 'document_relation';

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
