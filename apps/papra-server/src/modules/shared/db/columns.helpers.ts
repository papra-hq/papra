import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from '../random/ids';

export function createPrimaryKeyField({
  prefix,
  idGenerator = () => generateId({ prefix }),
}: { prefix?: string; idGenerator?: () => string } = {}) {
  return {
    id: text('id')
      .primaryKey()
      .$default(idGenerator),
  };
}

export function createCreatedAtField() {
  return {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
  };
}

export function createUpdatedAtField() {
  return {
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$default(() => new Date()),
  };
}

export function createTimestampColumns() {
  return {
    ...createCreatedAtField(),
    ...createUpdatedAtField(),
  };
}
