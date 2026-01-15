import type { SQL } from 'drizzle-orm';

export type QueryResult = {
  sqlQuery?: SQL;
  issues: { message: string; code: string }[];
};
