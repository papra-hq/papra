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
      component: lazy(() => import('./users/pages/list-users.page')),
    },
    {
      path: '/users/:userId',
      component: lazy(() => import('./users/pages/user-detail.page')),
    },
    {
      path: '/analytics',
      component: lazy(() => import('./analytics/pages/analytics.page')),
    },
    {
      path: '/organizations',
      component: lazy(() => import('./organizations/pages/list-organizations.page')),
    },
    {
      path: '/organizations/:organizationId',
      component: lazy(() => import('./organizations/pages/organization-detail.page')),
    },
    {
      path: '/*404',
      component: NotFoundPage,
    },
  ],
};
