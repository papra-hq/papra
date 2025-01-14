import type { ServerInstance } from './server.types';
import { registerDocumentsPrivateRoutes } from '../documents/documents.routes';
import { registerOrganizationsPrivateRoutes } from '../organizations/organizations.routes';
import { registerUsersPrivateRoutes } from '../users/users.routes';
import { createUnauthorizedError } from './auth/auth.errors';
import { getSession } from './auth/auth.models';
import { registerAuthRoutes } from './auth/auth.routes';
// import { jwtValidationMiddleware } from './auth/middlewares/auth.middleware';
// import { impersonationMiddleware } from './auth/middlewares/impersonation.middleware';
import { registerHealthCheckRoutes } from './health-check/health-check.routes';

export function registerRoutes({ app }: { app: ServerInstance }) {
  registerAuthRoutes({ app });

  registerPublicRoutes({ app });
  registerPrivateRoutes({ app });
}

function registerPublicRoutes({ app }: { app: ServerInstance }) {
  registerHealthCheckRoutes({ app });
}

function registerPrivateRoutes({ app }: { app: ServerInstance }) {
  // app.use(jwtValidationMiddleware);
  // app.use(impersonationMiddleware);

  app.use(async (context, next) => {
    const { session } = getSession({ context });

    if (!session) {
      throw createUnauthorizedError();
    }

    await next();
  });

  registerUsersPrivateRoutes({ app });
  registerOrganizationsPrivateRoutes({ app });
  registerDocumentsPrivateRoutes({ app });
}
