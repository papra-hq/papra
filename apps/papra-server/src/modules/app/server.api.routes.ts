import type { ApiDependencies, RouteDefinitionContext } from './server.types';

import { buildApiRequestHandler } from '../api/api.request-handler';
import { buildConfigApiRoutes } from '../config/config.api.routes';
import { buildOrganizationsApiRoutes } from '../organizations/organizations.api.routes';
import { buildUserApiRoutes } from '../users/users.api.routes';
import { buildTagsApiRoutes } from '../tags/tags.api.routes';
import { buildHealthCheckApiRoutes } from './health-check/health-check.api.routes';
import {
  buildGetApiKey,
  buildGetSession,
  buildResolveAuthenticationContext,
} from '../api/api.authentication';

function buildApiRoutes(deps: ApiDependencies) {
  return [
    ...buildHealthCheckApiRoutes(deps),
    ...buildConfigApiRoutes(deps),
    ...buildUserApiRoutes(deps),
    ...buildOrganizationsApiRoutes(deps),
    ...buildTagsApiRoutes(deps),
  ];
}

export function registerApiRoutes({ app, ...deps }: RouteDefinitionContext) {
  const { auth, db } = deps;

  const resolveAuthenticationContext = buildResolveAuthenticationContext({
    getSession: buildGetSession({ auth }),
    getApiKey: buildGetApiKey({ db }),
  });

  const apiDeps = {
    ...deps,
    resolveAuthenticationContext,
  };

  const handleApiRequest = buildApiRequestHandler({
    routes: buildApiRoutes(apiDeps),
  });

  app.use('/api/*', async (context, next) => {
    // Keep the legacy static batch route ahead of the migrated :documentId/tags route.
    // Remove this bypass when the batch endpoint joins the contract router.
    if (
      context.req.method === 'POST' &&
      /^\/api\/organizations\/[^/]+\/documents\/batch\/tags$/.test(context.req.path)
    ) {
      return next();
    }

    const response = await handleApiRequest({
      request: context.req.raw,
    });

    if (response !== undefined) {
      return response;
    }

    await next();
  });
}
