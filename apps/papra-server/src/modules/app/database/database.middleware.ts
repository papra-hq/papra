import type { ServerInstanceGenerics } from '../server.types';
import type { Database } from './database.types';
import { createMiddleware } from 'hono/factory';

export function createDatabaseMiddleware({ db }: { db: Database }) {
  return createMiddleware<ServerInstanceGenerics>(async (context, next) => {
    context.set('db', db);

    await next();
  });
}
