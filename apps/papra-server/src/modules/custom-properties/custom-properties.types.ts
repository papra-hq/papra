import type { Expand } from '@corentinth/chisels';
import type { customPropertyDefinitionsTable, documentCustomPropertyValuesTable } from './custom-properties.table';
import type { customPropertySelectOptionsTable } from './options/custom-properties-options.table';

export type CustomPropertyDefinition = Expand<typeof customPropertyDefinitionsTable.$inferSelect>;
export type DbInsertableCustomPropertyDefinition = Expand<typeof customPropertyDefinitionsTable.$inferInsert>;

export type CustomPropertySelectOption = Expand<typeof customPropertySelectOptionsTable.$inferSelect>;
export type DbInsertableCustomPropertySelectOption = Expand<typeof customPropertySelectOptionsTable.$inferInsert>;

export type DocumentCustomPropertyValue = Expand<typeof documentCustomPropertyValuesTable.$inferSelect>;
export type DbInsertableDocumentCustomPropertyValue = Expand<typeof documentCustomPropertyValuesTable.$inferInsert>;
