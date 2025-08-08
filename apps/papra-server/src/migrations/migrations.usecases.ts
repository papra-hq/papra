import type { Database } from '../modules/app/database/database.types';
import type { Logger } from '../modules/shared/logger/logger';
import type { Migration } from './migrations.types';
import { safely } from '@corentinth/chisels';
import { createLogger } from '../modules/shared/logger/logger';
import { migrations as migrationsList } from './migrations.registry';
import { deleteMigration, getMigrations, saveMigration, setupMigrationTableIfNotExists } from './migrations.repository';

export async function runMigrations({ db, migrations = migrationsList, logger = createLogger({ namespace: 'migrations' }) }: { db: Database; migrations?: Migration[]; logger?: Logger }) {
  await setupMigrationTableIfNotExists({ db });

  if (migrations.length === 0) {
    logger.info('No migrations to run, skipping');
    return;
  }

  const { migrations: existingMigrations } = await getMigrations({ db });

  const migrationsToRun = migrations.filter(migration => !existingMigrations.some(m => m.name === migration.name));

  if (migrationsToRun.length === 0) {
    logger.info('All migrations already applied');
    return;
  }

  logger.debug({
    migrations: migrations.map(m => m.name),
    migrationsToRun: migrationsToRun.map(m => m.name),
    existingMigrations: existingMigrations.map(m => m.name),
    migrationsToRunCount: migrationsToRun.length,
    existingMigrationsCount: existingMigrations.length,
  }, 'Running migrations');

  for (const migration of migrationsToRun) {
    const [, error] = await safely(upMigration({ db, migration }));

    if (error) {
      logger.error({ error, migrationName: migration.name }, 'Failed to run migration');
      throw error;
    }

    logger.info({ migrationName: migration.name }, 'Migration run successfully');
  }

  logger.info('All migrations run successfully');
}

async function upMigration({ db, migration }: { db: Database; migration: Migration }) {
  const { name, up } = migration;

  await up({ db });
  await saveMigration({ db, migrationName: name });
}

export async function rollbackLastAppliedMigration({ db, migrations = migrationsList, logger = createLogger({ namespace: 'migrations' }) }: { db: Database; migrations?: Migration[]; logger?: Logger }) {
  await setupMigrationTableIfNotExists({ db });

  const { migrations: existingMigrations } = await getMigrations({ db });
  const lastMigrationInDb = existingMigrations[existingMigrations.length - 1];

  if (!lastMigrationInDb) {
    logger.info('No migrations to rollback');
    return;
  }

  const lastMigration = migrations.find(m => m.name === lastMigrationInDb.name);

  if (!lastMigration) {
    logger.error({ migrationName: lastMigrationInDb.name }, 'Migration in database not found in saved migrations');
    throw new Error(`Migration ${lastMigrationInDb.name} not found`);
  }

  await downMigration({ db, migration: lastMigration });

  logger.info({ migrationName: lastMigration.name }, 'Migration rolled back successfully');
}

async function downMigration({ db, migration }: { db: Database; migration: Migration }) {
  const { name, down } = migration;

  await down?.({ db });
  await deleteMigration({ db, migrationName: name });
}
