import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { organizationsTable } from '../organizations/organizations.table';
import { createPrimaryKeyField, createTimestampColumns } from '../shared/db/columns.helpers';
import { INTAKE_EMAIL_ID_PREFIX } from './intake-emails.constants';

export const intakeEmailsTable = sqliteTable('intake_emails', {
  ...createPrimaryKeyField({ prefix: INTAKE_EMAIL_ID_PREFIX }),
  ...createTimestampColumns(),

  emailAddress: text('email_address').notNull().unique(),
  organizationId: text('organization_id').notNull().references(() => organizationsTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  allowedOrigins: text('allowed_origins', { mode: 'json' }).notNull().$type<string[]>().default([]),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
});
