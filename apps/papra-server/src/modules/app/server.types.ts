import type { Context as BaseContext, Hono } from 'hono';
import type { ApiKey } from '../api-keys/api-keys.types';
import type { Config } from '../config/config.types';
import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { EmailsServices } from '../emails/emails.services';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import type { TaskServices } from '../tasks/tasks.services';
import type { TrackingServices } from '../tracking/tracking.services';
import type { Auth } from './auth/auth.services';
import type { Session } from './auth/auth.types';
import type { Database } from './database/database.types';

export type ServerInstanceGenerics = {
  Variables: {
    userId: string | null;
    session: Session | null;
    apiKey: ApiKey | null;
    authType: 'session' | 'api-key' | null;
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
  trackingServices: TrackingServices;
  taskServices: TaskServices;
  documentsStorageService: DocumentStorageService;
};

export type RouteDefinitionContext = { app: ServerInstance } & GlobalDependencies;
