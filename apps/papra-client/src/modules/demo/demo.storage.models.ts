import type { Storage, StorageValue } from 'unstorage';

export async function getValues<T extends StorageValue>(storage: Storage<T>): Promise<T[]> {
  const keys = await storage.getKeys();

  const values = await Promise.all(keys.map(key => storage.getItem(key))) as T[];

  return values;
}

export async function findOne<T extends StorageValue>(storage: Storage<T>, predicate: (value: T) => boolean): Promise< T | null> {
  const values = await getValues(storage);
  const found = values.find(predicate);

  return found ?? null;
}

export async function findMany<T extends StorageValue>(storage: Storage<T>, predicate: (value: T) => boolean): Promise<T[]> {
  const values = await getValues(storage);
  const found = values.filter(predicate);

  return found;
}
