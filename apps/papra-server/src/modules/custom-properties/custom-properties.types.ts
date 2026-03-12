import type { Expand } from '@corentinth/chisels';
import type { customPropertyDefinitionsTable, customPropertySelectOptionsTable, documentCustomPropertyValuesTable } from './custom-properties.table';

export type CustomPropertyDefinition = Expand<typeof customPropertyDefinitionsTable.$inferSelect>;
export type DbInsertableCustomPropertyDefinition = Expand<typeof customPropertyDefinitionsTable.$inferInsert>;

export type CustomPropertySelectOption = Expand<typeof customPropertySelectOptionsTable.$inferSelect>;
export type DbInsertableCustomPropertySelectOption = Expand<typeof customPropertySelectOptionsTable.$inferInsert>;

export type DocumentCustomPropertyValue = Expand<typeof documentCustomPropertyValuesTable.$inferSelect>;
export type DbInsertableDocumentCustomPropertyValue = Expand<typeof documentCustomPropertyValuesTable.$inferInsert>;

export type CustomPropertyDefinitionWithOptions = CustomPropertyDefinition & {
  options: CustomPropertySelectOption[];
};

export type SelectOptionForApi = {
  id: string;
  value: string;
  color: string | null;
};

export type DocumentPropertyValueForApi = {
  propertyDefinitionId: string;
  name: string;
  value: string | number | boolean | Date | SelectOptionForApi | SelectOptionForApi[] | null;
};
