import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createPrimaryKeyField, createTimestampColumns } from '../../shared/db/columns.helpers';
import { organizationsTable } from '../organizations.table';
import { ORGANIZATION_SETTINGS_ID_PREFIX } from './organization-settings.constants';

export const organizationSettingsTable = sqliteTable('organization_settings', {
  ...createPrimaryKeyField({ prefix: ORGANIZATION_SETTINGS_ID_PREFIX }),
  ...createTimestampColumns(),

  // One settings row per organization
  organizationId: text('organization_id')
    .notNull()
    .unique()
    .references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),

  // AI auto-tagging settings
  aiAutoTaggingEnabled: integer('ai_auto_tagging_enabled', { mode: 'boolean' }),
  aiAutoTaggingCanCreateNewTags: integer('ai_auto_tagging_can_create_new_tags', {
    mode: 'boolean',
  }),
  aiAutoTaggingMaxTags: integer('ai_auto_tagging_max_tags'),
  aiAutoTaggingModelId: text('ai_auto_tagging_model_id'),
});
