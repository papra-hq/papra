import type { Database } from './database.types';
import { documentsTable } from '../../documents/documents.table';
import { intakeEmailsTable } from '../../intake-emails/intake-emails.tables';
import { organizationMembersTable, organizationsTable } from '../../organizations/organizations.table';
import { documentsTagsTable, tagsTable } from '../../tags/tags.table';
import { usersTable } from '../../users/users.table';
import { setupDatabase } from './database';
import { runMigrations } from './database.services';

export { createInMemoryDatabase, seedDatabase };

async function createInMemoryDatabase(seedOptions: Omit<Parameters<typeof seedDatabase>[0], 'db'> | undefined = {}) {
  const { db } = setupDatabase({ url: ':memory:' });

  await runMigrations({ db });

  await seedDatabase({ db, ...seedOptions });

  return {
    db,
  };
}

const seedTables = {
  users: usersTable,
  organizations: organizationsTable,
  organizationMembers: organizationMembersTable,
  documents: documentsTable,
  tags: tagsTable,
  documentsTags: documentsTagsTable,
  intakeEmails: intakeEmailsTable,
} as const;

type SeedTablesRows = {
  [K in keyof typeof seedTables]?: typeof seedTables[K] extends { $inferInsert: infer T } ? T[] : never;
};

async function seedDatabase({ db, ...seedRows }: { db: Database } & SeedTablesRows) {
  await Promise.all(
    Object
      .entries(seedRows)
      .map(([table, rows]) => db
        .insert(seedTables[table as keyof typeof seedTables])
        .values(rows)
        .execute(),
      ),
  );
}
