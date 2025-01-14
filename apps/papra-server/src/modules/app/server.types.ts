import type { Context as BaseContext, Hono } from 'hono';
import type { Config } from '../config/config.types';
import type { getAuth } from './auth/auth.services';
import type { Database } from './database/database.types';

export type ServerInstanceGenerics = {
  Variables: {
    config: Config;
    db: Database;
    user: ReturnType<typeof getAuth>['auth']['$Infer']['Session']['user'] | null;
    session: ReturnType<typeof getAuth>['auth']['$Infer']['Session']['session'] | null;
  };
};

export type Context = BaseContext<ServerInstanceGenerics>;

export type ServerInstance = Hono<ServerInstanceGenerics>;
