import type { NonEmptyArray } from '../shared/types';
import type { CustomPropertyType } from './custom-properties.constants';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { documentsTable } from '../documents/documents.table';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { usersTable } from '../users/users.table';
import {
  CUSTOM_PROPERTY_DEFINITION_ID_PREFIX,
  CUSTOM_PROPERTY_TYPES_LIST,
  DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX,
} from './custom-properties.constants';
import { customPropertySelectOptionsTable } from './options/custom-properties-options.table';

export const customPropertyDefinitionsTable = sqliteTable(
  'custom_property_definitions',
  {
    ...createPrimaryKeyField({ prefix: CUSTOM_PROPERTY_DEFINITION_ID_PREFIX }),
    ...createTimestampColumns(),

    organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    key: text('key').notNull(),
    description: text('description'),
    type: text('type', { enum: CUSTOM_PROPERTY_TYPES_LIST as NonEmptyArray<CustomPropertyType> }).notNull(),
    config: text('config', { mode: 'json' }).$type<Record<string, unknown>>(),
    displayOrder: integer('display_order').notNull().default(0),
  },
);

export const documentCustomPropertyValuesTable = sqliteTable(
  'document_custom_property_values',
  {
    ...createPrimaryKeyField({ prefix: DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX }),
    ...createTimestampColumns(),

    documentId: text('document_id').notNull().references(() => documentsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    propertyDefinitionId: text('property_definition_id').notNull().references(() => customPropertyDefinitionsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

    textValue: text('text_value'),
    numberValue: real('number_value'),
    dateValue: integer('date_value', { mode: 'timestamp_ms' }),
    booleanValue: integer('boolean_value', { mode: 'boolean' }),
    selectOptionId: text('select_option_id').references(() => customPropertySelectOptionsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userId: text('user_id').references(() => usersTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    relatedDocumentId: text('related_document_id').references(() => documentsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  },
);
