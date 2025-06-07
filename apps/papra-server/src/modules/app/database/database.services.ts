import type { Config } from '../../config/config.types';
import type { Database } from './database.types';
import { dirname, join } from 'node:path';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { ensureDirectoryExists } from '../../shared/fs/fs.services';
import { createLogger } from '../../shared/logger/logger';
import { fileUrlToPath, getRootDirPath } from '../../shared/path';

const logger = createLogger({ namespace: 'database-services' });

export async function runMigrations({ db }: { db: Database }) {
  const migrationsFolder = join(getRootDirPath(), 'migrations');

  await migrate(db, { migrationsFolder });
}

export async function ensureLocalDatabaseDirectoryExists({ config }: { config: Config }) {
  const { url } = config.database;

  if (!url.startsWith('file:')) {
    return;
  }

  const dbPath = fileUrlToPath({ fileUrl: url });
  const dbDir = dirname(dbPath);

  try {
    const { hasBeenCreated } = await ensureDirectoryExists({ path: dbDir });

    if (hasBeenCreated) {
      logger.info({ dbUrl: url, dbDir, dbPath }, 'Database directory missing, created it');
    }
  } catch (error) {
    logger.error({ error, dbDir, dbPath }, 'Failed to ensure that the database directory exists, error while creating the directory. Please see https://docs.papra.app/resources/troubleshooting/#failed-to-ensure-that-the-database-directory-exists for more information.');
  }
}
