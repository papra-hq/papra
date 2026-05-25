import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../../shared/db/columns.helpers';
import { customPropertyDefinitionsTable } from '../custom-properties.table';
import { CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX } from './custom-properties-options.constants';

export const customPropertySelectOptionsTable = sqliteTable(
  'custom_property_select_options',
  {
    ...createPrimaryKeyField({ prefix: CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX }),
    ...createTimestampColumns(),

    propertyDefinitionId: text('property_definition_id').notNull().references(() => customPropertyDefinitionsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: text('name').notNull(),
    key: text('key').notNull(),
    displayOrder: integer('display_order').notNull().default(0),
  },
);
