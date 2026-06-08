import type { SQLiteSelect } from 'drizzle-orm/sqlite-core';
import type { ArrayElement } from '../../shared/types';
import type { Database } from './database.types';
import { sql } from 'drizzle-orm';

export function createIterator<T extends SQLiteSelect>({
  query,
  batchSize = 100,
}: {
  query: T;
  batchSize?: number;
}): AsyncGenerator<ArrayElement<T['_']['result']>> {
  return createBatchedIterator({
    getBatch: async ({ offset, limit }) =>
      (await query.limit(limit).offset(offset)) as ArrayElement<T['_']['result']>[],
    batchSize,
  });
}

export async function* createBatchedIterator<T>({
  getBatch,
  batchSize = 100,
}: {
  getBatch: (args: { offset: number; limit: number }) => Promise<T[]>;
  batchSize?: number;
}): AsyncGenerator<T> {
  let offset = 0;

  while (true) {
    const results = await getBatch({ offset, limit: batchSize });
    if (results.length === 0) {
      break;
    }

    for (const result of results) {
      yield result;
    }

    if (results.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}

export async function getRuntimeTableColumns({
  tableName,
  db,
}: {
  tableName: string;
  db: Database;
}): Promise<string[]> {
  const { rows } = await db.run(sql`SELECT name FROM pragma_table_info(${tableName})`);

  return rows.map((row) => String(row.name));
}
