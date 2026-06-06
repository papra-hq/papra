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

async function upsertEntry({ key, value, expiresAtMsEpoch, db }: { key: string; value: JsonSerializableValue; expiresAtMsEpoch: number | null; db: Database }) {
  await db
    .insert(kvStoreTable)
    .values({ key, value, expiresAt: expiresAtMsEpoch })
    .onConflictDoUpdate({ target: kvStoreTable.key, set: { value, expiresAt: expiresAtMsEpoch } });
}

async function deleteEntry({ key, db }: { key: string; db: Database }) {
  await db.delete(kvStoreTable).where(eq(kvStoreTable.key, key));
}

async function deleteExpiredEntry({ key, nowMsEpoch, db }: { key: string; nowMsEpoch: number; db: Database }) {
  await db
    .delete(kvStoreTable)
    .where(
      and(
        eq(kvStoreTable.key, key),
        isNotNull(kvStoreTable.expiresAt),
        lte(kvStoreTable.expiresAt, nowMsEpoch),
      ),
    );
}

async function deleteAllExpiredEntries({ nowMsEpoch, db }: { nowMsEpoch: number; db: Database }) {
  const deleted = await db
    .delete(kvStoreTable)
    .where(
      and(
        isNotNull(kvStoreTable.expiresAt),
        lte(kvStoreTable.expiresAt, nowMsEpoch),
      ),
    )
    .returning({ key: kvStoreTable.key });

  return { deletedCount: deleted.length };
}
