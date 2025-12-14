import type { RouteDefinitionContext } from '../app/server.types';
import { registerAnalyticsRoutes } from './analytics/analytics.routes';

export function registerAdminRoutes(context: RouteDefinitionContext) {
  registerAnalyticsRoutes(context);
}
