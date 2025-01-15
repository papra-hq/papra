import type { Context as BaseContext, Hono } from 'hono';
import type { Config } from '../config/config.types';
import type { Auth } from './auth/auth.services';
import type { Database } from './database/database.types';

export type ServerInstanceGenerics = {
  Variables: {
    config: Config;
    db: Database;
    auth: Auth;
    user: Auth['$Infer']['Session']['user'] | null;
    session: Auth['$Infer']['Session']['session'] | null;
  };
};

export type Context = BaseContext<ServerInstanceGenerics>;

export type ServerInstance = Hono<ServerInstanceGenerics>;
