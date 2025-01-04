import type { Context as BaseContext, Hono } from 'hono';
import type { Config } from '../config/config.types';
import type { Database } from './database/database.types';

export type ServerInstanceGenerics = {
  Variables: {
    config: Config;
    db: Database;
    jwtPayload: Record<string, unknown>;
    userId?: string;
    authUserId?: string;
  };
};

export type Context = BaseContext<ServerInstanceGenerics>;

export type ServerInstance = Hono<ServerInstanceGenerics>;
