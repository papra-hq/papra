import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from '../random/ids';

export { createCreatedAtField, createPrimaryKeyField, createSoftDeleteColumns, createTimestampColumns, createUpdatedAtField };

function createPrimaryKeyField({
  prefix,
  idGenerator = () => generateId({ prefix }),
}: { prefix?: string; idGenerator?: () => string } = {}) {
  return {
    id: text('id')
      .primaryKey()
      .$default(idGenerator),
  };
}

function createCreatedAtField() {
  return {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
  };
}

function createUpdatedAtField() {
  return {
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
  };
}

function createTimestampColumns() {
  return {
    ...createCreatedAtField(),
    ...createUpdatedAtField(),
  };
}

function createSoftDeleteColumns() {
  return {
    isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
  };
}
