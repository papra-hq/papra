import type { RouteDefinitionContext } from '../app/server.types';
import { createIntakeEmailsServices } from '../intake-emails/intake-emails.services';
import { getPublicConfig } from './config.models';

export function registerConfigRoutes(context: RouteDefinitionContext) {
  setupGetPublicConfigRoute(context);
}

function setupGetPublicConfigRoute({ app, config }: RouteDefinitionContext) {
  const intakeEmailsServices = createIntakeEmailsServices({ config });
  const { publicConfig } = getPublicConfig({ config, intakeEmailsServices });

  app.get('/api/config', async (context) => {
    return context.json({ config: publicConfig });
  });
}
