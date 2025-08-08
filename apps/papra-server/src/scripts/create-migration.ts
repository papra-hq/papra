import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { camelCase, kebabCase } from 'lodash-es';
import { builders, loadFile, writeFile } from 'magicast';
import { runScript } from './commons/run-script';

const currentDirectory = import.meta.dirname;

const migrationsDirectory = path.join(currentDirectory, '..', 'migrations', 'list');

async function getLastMigrationFilePrefixNumber() {
  const migrations = await fs.readdir(migrationsDirectory);
  const lastMigrationFileName = migrations.filter(file => file.endsWith('.migration.ts')).toSorted().pop();

  if (lastMigrationFileName === undefined) {
    return 0;
  }

  const [, lastMigrationNumber] = lastMigrationFileName.match(/^(\d+)/) ?? [];
  return lastMigrationNumber === undefined ? 0 : Number.parseInt(lastMigrationNumber);
}

await runScript(
  { scriptName: 'create-migration' },
  async ({ logger }) => {
    const rawMigrationName = process.argv[2];

    if (rawMigrationName === undefined || rawMigrationName === '') {
      logger.error('Migration name is required, example: pnpm migrate:create <migration-name>');
      process.exit(1);
    }

    const migrationName = kebabCase(rawMigrationName);

    const lastMigrationPrefixNumber = await getLastMigrationFilePrefixNumber();
    const prefixNumber = (lastMigrationPrefixNumber + 1).toString().padStart(4, '0');

    const fileNameWithoutExtension = `${prefixNumber}-${migrationName}.migration`;
    const fileName = `${fileNameWithoutExtension}.ts`;

    const migrationPath = path.join(migrationsDirectory, fileName);
    const migrationObjectIdentifier = `${camelCase(migrationName)}Migration`;

    await fs.writeFile(migrationPath, `
import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const ${migrationObjectIdentifier} = {
  name: '${migrationName}',

  up: async ({ db }) => {
    await db.batch([
      db.run(sql\`SELECT 1\`),
    ]);
  },

  down: async ({ db }) => {
    await db.batch([
      db.run(sql\`SELECT 1\`),
    ]);
  },
} satisfies Migration;`.trim());

    logger.info(`Migration ${fileName} created`);

    const registry = await loadFile(path.join(migrationsDirectory, '..', 'migrations.registry.ts'));

    registry.imports.$append({
      imported: migrationObjectIdentifier,
      from: `./list/${fileNameWithoutExtension}`,
    });

    // eslint-disable-next-line ts/no-unsafe-call, ts/no-unsafe-member-access
    registry.exports.migrations.push(builders.raw(migrationObjectIdentifier));

    await writeFile(registry, path.join(migrationsDirectory, '..', 'migrations.registry.ts'));
  },
);
