import type { Migration } from '../migrations.types';

export const dropLegacyMigrationsMigration = {
  name: 'drop-legacy-migrations',
  description: 'Drop the legacy migrations table as it is not used anymore',

  up: async ({ db }) => {
    await db.schema.dropTable('__drizzle_migrations').ifExists().execute();
  },
} satisfies Migration;
