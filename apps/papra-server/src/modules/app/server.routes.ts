import type { ServerInstance } from './server.types';
import { registerDocumentsPrivateRoutes } from '../documents/documents.routes';
import { registerOrganizationsPrivateRoutes } from '../organizations/organizations.routes';
import { registerUsersPrivateRoutes } from '../users/users.routes';
import { registerAuthPrivateRoutes, registerAuthPublicRoutes } from './auth/auth.routes';
import { jwtValidationMiddleware } from './auth/middlewares/auth.middleware';
import { impersonationMiddleware } from './auth/middlewares/impersonation.middleware';

export function registerRoutes({ app }: { app: ServerInstance }) {
  registerPublicRoutes({ app });
  registerPrivateRoutes({ app });
}

function registerPublicRoutes({ app }: { app: ServerInstance }) {
  app.get('/api/ping', context => context.json({ status: 'ok' }));

  registerAuthPublicRoutes({ app });
}

function registerPrivateRoutes({ app }: { app: ServerInstance }) {
  app.use(jwtValidationMiddleware);
  app.use(impersonationMiddleware);

  registerAuthPrivateRoutes({ app });
  registerUsersPrivateRoutes({ app });
  registerOrganizationsPrivateRoutes({ app });
  registerDocumentsPrivateRoutes({ app });
}
