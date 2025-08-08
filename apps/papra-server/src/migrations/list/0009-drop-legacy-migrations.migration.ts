import type { Migration } from '../migrations.types';
import { sql } from 'drizzle-orm';

export const dropLegacyMigrationsMigration = {
  name: 'drop-legacy-migrations',
  description: 'Drop the legacy migrations table as it is not used anymore',

  up: async ({ db }) => {
    await db.run(sql`DROP TABLE IF EXISTS "__drizzle_migrations"`);
  },

} satisfies Migration;
