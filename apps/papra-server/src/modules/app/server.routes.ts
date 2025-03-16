import type { ServerInstance } from './server.types';
import { registerConfigPublicRoutes } from '../config/config.routes';
import { registerDocumentsPrivateRoutes } from '../documents/documents.routes';
import { registerIntakeEmailsPrivateRoutes, registerIntakeEmailsPublicRoutes } from '../intake-emails/intake-emails.routes';
import { registerOrganizationsPrivateRoutes } from '../organizations/organizations.routes';
import { registerTagsRoutes } from '../tags/tags.routes';
import { registerUsersPrivateRoutes } from '../users/users.routes';
import { createUnauthorizedError } from './auth/auth.errors';
import { getSession } from './auth/auth.models';
import { registerAuthRoutes } from './auth/auth.routes';
import { registerHealthCheckRoutes } from './health-check/health-check.routes';

export function registerRoutes({ app }: { app: ServerInstance }) {
  registerAuthRoutes({ app });

  registerPublicRoutes({ app });
  registerPrivateRoutes({ app });
}

function registerPublicRoutes({ app }: { app: ServerInstance }) {
  registerConfigPublicRoutes({ app });
  registerHealthCheckRoutes({ app });
  registerIntakeEmailsPublicRoutes({ app });
}

function registerPrivateRoutes({ app }: { app: ServerInstance }) {
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
  registerTagsRoutes({ app });
  registerIntakeEmailsPrivateRoutes({ app });
}
