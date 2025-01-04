import type { SQL } from 'drizzle-orm';
import type { SQLiteColumn, SQLiteSelect } from 'drizzle-orm/sqlite-core';

export function withPagination<T extends SQLiteSelect>(query: T, {
  orderByColumn,
  pageIndex,
  pageSize,
}: {
  orderByColumn: SQLiteColumn | SQL;
  pageIndex: number;
  pageSize: number;
}) {
  return query
    .orderBy(orderByColumn)
    .limit(pageSize)
    .offset(pageIndex * pageSize);
}
