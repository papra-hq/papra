import type { Database } from './database.types';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { documentsTable } from '../../documents/documents.table';
import { organizationsTable, organizationUsersTable } from '../../organizations/organizations.table';
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
}: {
  db: Database;
  users?: typeof usersTable.$inferInsert[];
  organizations?: typeof organizationsTable.$inferInsert[];
  organizationUsers?: typeof organizationUsersTable.$inferInsert[];
  documents?: typeof documentsTable.$inferInsert[];
}) {
  await Promise.all([
    users && db.insert(usersTable).values(users).execute(),
    organizations && db.insert(organizationsTable).values(organizations).execute(),
    organizationUsers && db.insert(organizationUsersTable).values(organizationUsers).execute(),
    documents && db.insert(documentsTable).values(documents).execute(),
  ]);
}
