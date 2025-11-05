import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export type MigrationTable = {
  id: Generated<number>;
  name: string;
  run_at: ColumnType<number, number | undefined, never>;
};

export type DbSelectableMigration = Selectable<MigrationTable>;
export type DbInsertableMigration = Insertable<MigrationTable>;
export type DbUpdatableMigration = Updateable<MigrationTable>;

export type InsertableMigration = Omit<DbInsertableMigration, 'id' | 'run_at'>;
export type Migration = {
  id: number;
  name: string;
  runAt: Date;
};
