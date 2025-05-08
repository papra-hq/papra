import type { RouteDefinitionContext } from './server.types';
import { registerApiKeysRoutes } from '../api-keys/api-keys.routes';
import { registerConfigRoutes } from '../config/config.routes';
import { registerDocumentsRoutes } from '../documents/documents.routes';
import { registerIntakeEmailsRoutes } from '../intake-emails/intake-emails.routes';
import { registerOrganizationsRoutes } from '../organizations/organizations.routes';
import { registerSubscriptionsRoutes } from '../subscriptions/subscriptions.routes';
import { registerTaggingRulesRoutes } from '../tagging-rules/tagging-rules.routes';
import { registerTagsRoutes } from '../tags/tags.routes';
import { registerUsersRoutes } from '../users/users.routes';
import { registerWebhooksRoutes } from '../webhooks/webhook.routes';
import { registerAuthRoutes } from './auth/auth.routes';
import { registerHealthCheckRoutes } from './health-check/health-check.routes';

export function registerRoutes(context: RouteDefinitionContext) {
  registerAuthRoutes(context);
  registerConfigRoutes(context);
  registerHealthCheckRoutes(context);
  registerIntakeEmailsRoutes(context);
  registerSubscriptionsRoutes(context);
  registerUsersRoutes(context);
  registerOrganizationsRoutes(context);
  registerDocumentsRoutes(context);
  registerTagsRoutes(context);
  registerTaggingRulesRoutes(context);
  registerApiKeysRoutes(context);
  registerWebhooksRoutes(context);
}
