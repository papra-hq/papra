import type { Database } from '../modules/app/database/database.types';

export type MigrationArguments = {
  db: Database;
};

export type Migration = {
  /**
   * The name of the migration. Must be unique.
   */
  name: string;

  /**
   * Optional description of the migration, serves to add more context to the migration for humans.
   */
  description?: string;

  up: (args: MigrationArguments) => Promise<unknown>;
  down?: (args: MigrationArguments) => Promise<unknown>;
};
