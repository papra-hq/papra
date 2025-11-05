import type { DatabaseClient } from '../database/database.types';
import { safely } from '@corentinth/chisels';
import { sql } from 'kysely';

export async function isDatabaseHealthy({ db }: { db: DatabaseClient }) {
  // "SELECT 1 as one"
  const [result, error] = await safely(db.selectNoFrom(sql.lit('1').as('one')).executeTakeFirst());

  return error === null && result?.one === '1';
}
