import type { ApiDependencies, RouteDefinitionContext } from './server.types';

import { buildApiRequestHandler } from '../api/api.request-handler';
import { buildUserApiRoutes } from '../users/users.api.routes';
import {
  buildGetApiKey,
  buildGetSession,
  buildResolveAuthenticationContext,
} from '../api/api.authentication';

function buildApiRoutes(deps: ApiDependencies) {
  return [...buildUserApiRoutes(deps)];
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
    const response = await handleApiRequest({
      request: context.req.raw,
    });

    if (response !== undefined) {
      return response;
    }

    await next();
  });
}
