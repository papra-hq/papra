import type { ApiDependencies } from '../app/server.types';
import { defineApiRoute } from '../api/api.routes';
import { createIntakeEmailsServices } from '../intake-emails/intake-emails.services';
import { getPublicConfigContract } from './config.api.contracts';
import { getPublicConfig } from './config.models';

export function buildConfigApiRoutes(deps: ApiDependencies) {
  return [setupGetPublicConfigRoute(deps)];
}

function setupGetPublicConfigRoute({ config }: ApiDependencies) {
  const intakeEmailsServices = createIntakeEmailsServices({ config });
  const { publicConfig } = getPublicConfig({ config, intakeEmailsServices });

  return defineApiRoute({
    contract: getPublicConfigContract,
    handler: async () => ({
      status: 200,
      contentType: 'application/json',
      body: { config: publicConfig },
    }),
  });
}
