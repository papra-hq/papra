import type { Context } from '../server.types';

export function getDb({ context }: { context: Context }) {
  const db = context.get('db');

  if (!db) {
    throw new Error('Database not found, getDb must be called after the database middleware.');
  }

  return { db };
}
