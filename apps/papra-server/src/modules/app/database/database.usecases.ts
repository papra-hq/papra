import type { SelectQueryBuilder } from 'kysely';
import type { Database } from './database.types';

export async function* createIterator<O>({
  query,
  batchSize = 100,
}: { query: SelectQueryBuilder<Database, any, O>; batchSize?: number }): AsyncGenerator<O> {
  let offset = 0;

  while (true) {
    const results = await query.limit(batchSize).offset(offset).execute();
    if (results.length === 0) {
      break;
    }

    for (const result of results) {
      yield result as Awaited<O>;
    }

    if (results.length < batchSize) {
      break;
    }

    offset += batchSize;
  }
}
