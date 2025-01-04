import type { Database } from './database.types';
import { migrate } from 'drizzle-orm/libsql/migrator';
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
}: {
  db: Database;
  users?: typeof usersTable.$inferInsert[];
}) {
  await Promise.all([
    users && db.insert(usersTable).values(users).execute(),
  ]);
}
