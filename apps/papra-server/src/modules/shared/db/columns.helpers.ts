import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from '../random';

export { createCreatedAtField, createPrimaryKeyField, createSoftDeleteColumns, createTimestampColumns, createUpdatedAtField };

function createPrimaryKeyField({ prefix }: { prefix?: string } = {}) {
  return {
    id: text('id')
      .primaryKey()
      .$default(() => generateId({ prefix })),
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
