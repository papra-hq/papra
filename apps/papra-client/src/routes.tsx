import { Navigate, type RouteDefinition, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Match, Show, Suspense, Switch } from 'solid-js';
import { createProtectedPage } from './modules/auth/middleware/protected-page.middleware';
import { EmailValidationRequiredPage } from './modules/auth/pages/email-validation-required.page';
import { LoginPage } from './modules/auth/pages/login.page';
import { RegisterPage } from './modules/auth/pages/register.page';
import { RequestPasswordResetPage } from './modules/auth/pages/request-password-reset.page';
import { ResetPasswordPage } from './modules/auth/pages/reset-password.page';
import { DeletedDocumentsPage } from './modules/documents/pages/deleted-documents.page';
import { DocumentPage } from './modules/documents/pages/document.page';
import { DocumentsPage } from './modules/documents/pages/documents.page';
import { fetchOrganizations } from './modules/organizations/organizations.services';
import { CreateFirstOrganizationPage } from './modules/organizations/pages/create-first-organization.page';
import { CreateOrganizationPage } from './modules/organizations/pages/create-organization.page';
import { OrganizationsSettingsPage } from './modules/organizations/pages/organizations-settings.page';
import { OrganizationsPage } from './modules/organizations/pages/organizations.page';
import { ComingSoonPage } from './modules/shared/pages/coming-soon.page';
import { NotFoundPage } from './modules/shared/pages/not-found.page';
import { TagsPage } from './modules/tags/pages/tags.page';
import { OrganizationLayout } from './modules/ui/layouts/organization.layout';
import { CurrentUserProvider, useCurrentUser } from './modules/users/composables/useCurrentUser';
import { UserSettingsPage } from './modules/users/pages/user-settings.page';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: CurrentUserProvider,
    children: [
      {
        path: '/',
        component: () => {
          const { getLatestOrganizationId } = useCurrentUser();

          const query = createQuery(() => ({
            queryKey: ['organizations'],
            queryFn: fetchOrganizations,
          }));

          return (
            <>
              <Suspense>
                <Show when={query.data?.organizations}>
                  {getOrgs => (
                    <Switch>
                      <Match when={getLatestOrganizationId() && getOrgs().some(org => org.id === getLatestOrganizationId())}>
                        <Navigate href={`/organizations/${getLatestOrganizationId()}`} />
                      </Match>

                      <Match when={query.data && query.data.organizations.length > 0}>
                        <Navigate href="/organizations" />
                      </Match>

                      <Match when={query.data && query.data.organizations.length === 0}>
                        <Navigate href="/organizations/first" />
                      </Match>
                    </Switch>
                  )}
                </Show>
              </Suspense>
            </>

          );
        },
      },
      {
        path: '/organizations',
        children: [
          {
            path: '/',
            component: OrganizationsPage,
          },
          {
            path: '/:organizationId',
            component: (props) => {
              const params = useParams();
              const { setLatestOrganizationId } = useCurrentUser();

              setLatestOrganizationId(params.organizationId);

              return <OrganizationLayout {...props} />;
            },
            matchFilters: {
              organizationId: /^org_[a-zA-Z0-9]+$/,
            },
            children: [
              {
                path: '/',
                component: DocumentsPage,
              },
              {
                path: '/documents',
                component: DocumentsPage,
              },
              {
                path: '/documents/:documentId',
                component: DocumentPage,
              },
              {
                path: '/settings',
                component: OrganizationsSettingsPage,
              },
              {
                path: '/deleted',
                component: DeletedDocumentsPage,
              },
              {
                path: '/tags',
                component: TagsPage,
              },
              {
                path: '/integrations',
                component: ComingSoonPage,
              },
            ],
          },
          {
            path: '/create',
            component: CreateOrganizationPage,
          },
          {
            path: '/first',
            component: CreateFirstOrganizationPage,
          },
        ],
      },
    ],
  },
  {
    path: '/settings',
    component: UserSettingsPage,
  },
  {
    path: '/login',
    component: createProtectedPage({ authType: 'public-only', component: LoginPage }),
  },
  {
    path: '/register',
    component: createProtectedPage({ authType: 'public-only', component: RegisterPage }),
  },
  {
    path: '/reset-password',
    component: createProtectedPage({ authType: 'public-only', component: ResetPasswordPage }),
  },
  {
    path: '/request-password-reset',
    component: createProtectedPage({ authType: 'public-only', component: RequestPasswordResetPage }),
  },
  {
    path: '/email-validation-required',
    component: createProtectedPage({ authType: 'public-only', component: EmailValidationRequiredPage }),
  },
  {
    path: '*404',
    component: NotFoundPage,
  },
];
