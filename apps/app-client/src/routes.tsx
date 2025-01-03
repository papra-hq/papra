import { A, Navigate, type RouteDefinition, useParams } from '@solidjs/router';
import { createProtectedPage } from './modules/auth/middleware/protected-page.middleware';
import { ConfirmPage } from './modules/auth/pages/confirm.page';
import { GenericAuthPage } from './modules/auth/pages/generic-auth.page';
import { MagicLinkSentPage } from './modules/auth/pages/magic-link-sent.page';
import { PendingMagicLinkPage } from './modules/auth/pages/verify-magic-link.page';
import { DocumentsPage } from './modules/documents/pages/documents.page';
import { CreateOrganizationPage } from './modules/organizations/pages/create-organization.page';
import { OrganizationsPage } from './modules/organizations/pages/organizations.page';
import { CheckoutCancelPage } from './modules/payments/pages/checkout-cancel.page';
import { CheckoutSuccessPage } from './modules/payments/pages/checkout-success.page';
import { Button } from './modules/ui/components/button';
import { OrganizationLayout } from './modules/ui/layouts/organization.layout';
import { CurrentUserProvider, useCurrentUser } from './modules/users/composables/useCurrentUser';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: CurrentUserProvider,
    children: [
      {
        path: '/',
        component: () => {
          const { getLatestOrganizationId } = useCurrentUser();

          return (
            <>
              {getLatestOrganizationId()
                ? <Navigate href={`/organizations/${getLatestOrganizationId()}`} />
                : <Navigate href="/organizations/create" />}
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
            ],
          },
          {
            path: '/create',
            component: CreateOrganizationPage,
          },
          // {
          //   path: '/settings',
          //   component: SettingsLayout,
          //   children: [
          //     {
          //       path: '/',
          //       component: () => <Navigate href="/settings/account" />,
          //     },
          //     {
          //       path: '/account',
          //       component: createProtectedPage({ authType: 'private', component: SettingsAccountPage }),
          //     },
          //     {
          //       path: '/billing',
          //       component: createProtectedPage({ authType: 'private', component: SettingsBillingPage }),
          //     },
          //   ],
          // },
        ],
      },

      {
        path: '/checkout-success',
        component: createProtectedPage({ authType: 'private', component: CheckoutSuccessPage }),
      },
      {
        path: '/checkout-cancel',
        component: createProtectedPage({ authType: 'private', component: CheckoutCancelPage }),
      },
    ],
  },
  {
    path: '/login',
    component: createProtectedPage({ authType: 'public-only', component: () => <GenericAuthPage type="login" /> }),
  },
  {
    path: '/register',
    component: createProtectedPage({ authType: 'public-only', component: () => <GenericAuthPage type="register" /> }),
  },
  {
    path: '/magic-link',
    component: createProtectedPage({ authType: 'public-only', component: MagicLinkSentPage }),
  },
  {
    path: '/magic-link/:token',
    component: createProtectedPage({ authType: 'public-only', component: PendingMagicLinkPage }),
  },
  {
    path: '/confirm',
    component: createProtectedPage({ authType: 'public-only', component: ConfirmPage }),
  },
  {
    path: '*404',
    component: () => (
      <div class="h-screen flex flex-col items-center justify-center p-6">

        <div class="flex items-center flex-row sm:gap-24">
          <div class="max-w-350px">
            <h1 class="text-xl mr-4 py-2">404 - Not Found</h1>
            <p class="text-muted-foreground">
              Sorry, the page you are looking for does seem to exist. Please check the URL and try again.
            </p>
            <Button as={A} href="/" class="mt-4" variant="default">
              <div class="i-tabler-arrow-left mr-2"></div>
              Go back to home
            </Button>
          </div>

          <div class="hidden sm:block light:text-muted-foreground">
            <div class="i-tabler-file-shredder text-200px"></div>
          </div>
        </div>
      </div>
    ),
  },
];
