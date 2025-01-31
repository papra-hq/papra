import type { Database } from './database.types';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { getRootDirPath } from '../../shared/path';

export async function runMigrations({ db }: { db: Database }) {
  const migrationsFolder = join(getRootDirPath(), 'migrations');

  await migrate(db, { migrationsFolder });
}
