import type { Database } from '../../../app/database/database.types';
import type { JsonSerializableValue } from '../../kv-store.types';
import { injectArguments } from '@corentinth/chisels';
import { and, eq, isNotNull, lte } from 'drizzle-orm';
import { kvStoreTable } from './libsql.kv-store-driver.table';

export type KvStoreRepository = ReturnType<typeof createKvStoreRepository>;

export function createKvStoreRepository({ db }: { db: Database }) {
  return injectArguments(
    {
      getEntry,
      upsertEntry,
      deleteEntry,
      deleteExpiredEntry,
      deleteAllExpiredEntries,
    },
    { db },
  );
}

async function getEntry({ key, db }: { key: string; db: Database }) {
  const [entry] = await db.select().from(kvStoreTable).where(eq(kvStoreTable.key, key)).limit(1);

  return { entry };
}

async function upsertEntry({ key, value, expiresAt, db }: { key: string; value: JsonSerializableValue; expiresAt: Date | null; db: Database }) {
  await db
    .insert(kvStoreTable)
    .values({ key, value, expiresAt })
    .onConflictDoUpdate({ target: kvStoreTable.key, set: { value, expiresAt } });
}

async function deleteEntry({ key, db }: { key: string; db: Database }) {
  await db.delete(kvStoreTable).where(eq(kvStoreTable.key, key));
}

async function deleteExpiredEntry({ key, db, now = new Date() }: { key: string; db: Database; now?: Date }) {
  await db
    .delete(kvStoreTable)
    .where(
      and(
        eq(kvStoreTable.key, key),
        isNotNull(kvStoreTable.expiresAt),
        lte(kvStoreTable.expiresAt, now),
      ),
    );
}

async function deleteAllExpiredEntries({ db, now = new Date() }: { db: Database; now?: Date }) {
  const deleted = await db
    .delete(kvStoreTable)
    .where(
      and(
        isNotNull(kvStoreTable.expiresAt),
        lte(kvStoreTable.expiresAt, now),
      ),
    )
    .returning({ key: kvStoreTable.key });

  return { deletedCount: deleted.length };
}
