import type { Database } from '../database/database.types';
import { safely } from '@corentinth/chisels';
import { sql } from 'drizzle-orm';

export async function isDatabaseHealthy({ db }: { db: Database }) {
  const [result, error] = await safely(db.run(sql`SELECT 1;`));

  return error === null && result.rows.length > 0 && result.rows[0]?.['1'] === 1;
}
