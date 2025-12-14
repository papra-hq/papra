import type { RouteDefinition } from '@solidjs/router';
import { Navigate } from '@solidjs/router';
import { lazy } from 'solid-js';
import { NotFoundPage } from '../shared/pages/not-found.page';

export const adminRoutes: RouteDefinition = {
  path: '/admin/*',
  component: lazy(() => import('./layouts/admin.layout')),
  children: [
    {
      path: '/',
      component: () => <Navigate href="/admin/analytics" />,
    },
    {
      path: '/users',
      component: lazy(() => import('./pages/list-users.page')),
    },
    {
      path: '/analytics',
      component: lazy(() => import('./analytics/pages/analytics.page')),
    },
    {
      path: '/organizations',
      component: () => <div class="p-6 text-muted-foreground">Not implemented yet.</div>,
    },
    {
      path: '/settings',
      component: () => <div class="p-6 text-muted-foreground">Not implemented yet.</div>,
    },
    {
      path: '/*404',
      component: NotFoundPage,
    },
  ],
};
