import type { Database } from './database.types';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { documentsTable } from '../../documents/documents.table';
import { intakeEmailsTable } from '../../intake-emails/intake-emails.tables';
import { organizationsTable, organizationUsersTable } from '../../organizations/organizations.table';
import { documentsTagsTable, tagsTable } from '../../tags/tags.table';
import { usersTable } from '../../users/users.table';
import { setupDatabase } from './database';

export { createInMemoryDatabase, seedDatabase };

async function createInMemoryDatabase(seedOptions: Omit<Parameters<typeof seedDatabase>[0], 'db'> | undefined = {}) {
  const { db } = setupDatabase({ url: ':memory:' });

  await migrate(db, { migrationsFolder: './migrations' });

  await seedDatabase({ db, ...seedOptions });

  return {
    db,
  };
}

async function seedDatabase({
  db,
  users,
  organizations,
  organizationUsers,
  documents,
  tags,
  documentsTags,
  intakeEmails,
}: {
  db: Database;
  users?: typeof usersTable.$inferInsert[];
  organizations?: typeof organizationsTable.$inferInsert[];
  organizationUsers?: typeof organizationUsersTable.$inferInsert[];
  documents?: typeof documentsTable.$inferInsert[];
  tags?: typeof tagsTable.$inferInsert[];
  documentsTags?: typeof documentsTagsTable.$inferInsert[];
  intakeEmails?: typeof intakeEmailsTable.$inferInsert[];
}) {
  await Promise.all([
    users && db.insert(usersTable).values(users).execute(),
    organizations && db.insert(organizationsTable).values(organizations).execute(),
    organizationUsers && db.insert(organizationUsersTable).values(organizationUsers).execute(),
    documents && db.insert(documentsTable).values(documents).execute(),
    tags && db.insert(tagsTable).values(tags).execute(),
    documentsTags && db.insert(documentsTagsTable).values(documentsTags).execute(),
    intakeEmails && db.insert(intakeEmailsTable).values(intakeEmails).execute(),
  ]);
}
