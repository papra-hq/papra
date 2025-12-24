import type { RouteDefinitionContext } from '../app/server.types';
import { registerAnalyticsRoutes } from './analytics/analytics.routes';
import { registerOrganizationManagementRoutes } from './organizations/organizations.routes';
import { registerUserManagementRoutes } from './users/users.routes';

export function registerAdminRoutes(context: RouteDefinitionContext) {
  registerAnalyticsRoutes(context);
  registerUserManagementRoutes(context);
  registerOrganizationManagementRoutes(context);
}
