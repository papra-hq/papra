import type { Context as BaseContext, Hono } from 'hono';
import type { Config } from '../config/config.types';
import type { EmailsServices } from '../emails/emails.services';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import type { Auth } from './auth/auth.services';
import type { Database } from './database/database.types';

export type ServerInstanceGenerics = {
  Variables: {
    user: Auth['$Infer']['Session']['user'] | null;
    session: Auth['$Infer']['Session']['session'] | null;
  };
};

export type Context = BaseContext<ServerInstanceGenerics>;

export type ServerInstance = Hono<ServerInstanceGenerics>;

export type GlobalDependencies = {
  config: Config;
  db: Database;
  auth: Auth;
  emailsServices: EmailsServices;
  subscriptionsServices: SubscriptionsServices;
};

export type RouteDefinitionContext = { app: ServerInstance } & GlobalDependencies;
