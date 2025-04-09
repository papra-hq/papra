import type { RouteDefinitionContext } from './server.types';
import { registerConfigPublicRoutes } from '../config/config.routes';
import { registerDocumentsPrivateRoutes } from '../documents/documents.routes';
import { registerIntakeEmailsPrivateRoutes, registerIntakeEmailsPublicRoutes } from '../intake-emails/intake-emails.routes';
import { registerOrganizationsPrivateRoutes } from '../organizations/organizations.routes';
import { registerSubscriptionsPrivateRoutes, registerSubscriptionsPublicRoutes } from '../subscriptions/subscriptions.routes';
import { registerTaggingRulesRoutes } from '../tagging-rules/tagging-rules.routes';
import { registerTagsRoutes } from '../tags/tags.routes';
import { registerUsersPrivateRoutes } from '../users/users.routes';
import { createUnauthorizedError } from './auth/auth.errors';
import { getSession } from './auth/auth.models';
import { registerAuthRoutes } from './auth/auth.routes';
import { registerHealthCheckRoutes } from './health-check/health-check.routes';

export function registerRoutes(context: RouteDefinitionContext) {
  registerAuthRoutes(context);

  registerPublicRoutes(context);
  registerPrivateRoutes(context);
}

function registerPublicRoutes(context: RouteDefinitionContext) {
  registerConfigPublicRoutes(context);
  registerHealthCheckRoutes(context);
  registerIntakeEmailsPublicRoutes(context);
  registerSubscriptionsPublicRoutes(context);
}

function registerPrivateRoutes(context: RouteDefinitionContext) {
  context.app.use(async (handlerContext, next) => {
    const { session } = getSession({ context: handlerContext });

    if (!session) {
      throw createUnauthorizedError();
    }

    await next();
  });

  registerUsersPrivateRoutes(context);
  registerOrganizationsPrivateRoutes(context);
  registerDocumentsPrivateRoutes(context);
  registerTagsRoutes(context);
  registerIntakeEmailsPrivateRoutes(context);
  registerSubscriptionsPrivateRoutes(context);
  registerTaggingRulesRoutes(context);
}
