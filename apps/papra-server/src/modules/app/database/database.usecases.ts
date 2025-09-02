import type { SQLiteSelect } from 'drizzle-orm/sqlite-core';
import type { ArrayElement } from '../../shared/types';

export async function* createIterator<T extends SQLiteSelect>({
  query,
  batchSize = 100,
}: { query: T; batchSize?: number }): AsyncGenerator<ArrayElement<T['_']['result']>> {
  let offset = 0;

  while (true) {
    const results = await query.limit(batchSize).offset(offset);
    if (results.length === 0) {
      break;
    }

    for (const result of results) {
      yield result as ArrayElement<T['_']['result']>;
    }

    if (results.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}
