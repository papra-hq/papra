export type CustomPropertyType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multi_select';

export type CustomPropertySelectOption = {
  id: string;
  propertyDefinitionId: string;
  value: string;
  color: string | null;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CustomPropertyDefinition = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  type: CustomPropertyType;
  color: string | null;
  isRequired: boolean;
  displayOrder: number;
  options: CustomPropertySelectOption[];
  createdAt: Date;
  updatedAt: Date;
};

export type DocumentPropertyValue = {
  propertyDefinitionId: string;
  name: string;
  value: string | number | boolean | string[] | null;
};
