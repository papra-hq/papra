import type { Component, ParentComponent } from 'solid-js';

import type { Organization } from '@/modules/organizations/organizations.types';

import { useNavigate, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { get } from 'lodash-es';
import { createEffect, on, Show } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { DocumentUploadProvider } from '@/modules/documents/components/document-import-status.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganization, fetchOrganizations } from '@/modules/organizations/organizations.services';
import { UpgradeDialog } from '@/modules/subscriptions/components/upgrade-dialog.component';
import { fetchOrganizationSubscription } from '@/modules/subscriptions/subscriptions.services';
import { Button } from '../components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { SideNav, SidenavLayout } from './sidenav.layout';

const UpgradeCTAFooter: Component<{ organizationId: string }> = (props) => {
  const { t } = useI18n();
  const { config } = useConfig();

  const query = useQuery(() => ({
    queryKey: ['organizations', props.organizationId, 'subscription'],
    queryFn: () => fetchOrganizationSubscription({ organizationId: props.organizationId }),
  }));

  const shouldShowUpgradeCTA = () => {
    if (!config.isSubscriptionsEnabled) {
      return false;
    }

    return query.data && query.data.plan.id === 'free';
  };

  return (
    <Show when={shouldShowUpgradeCTA()}>

      <div class="p-4 mx-4 mt-4 bg-background bg-gradient-to-br from-primary/15 to-transparent rounded-lg">
        <div class="flex items-center gap-2 text-sm font-medium">
          <div class="i-tabler-sparkles size-4 text-primary"></div>
          {t('layout.upgrade-cta.title')}
        </div>
        <div class="text-xs mt-1 mb-3 text-muted-foreground">
          {t('layout.upgrade-cta.description')}
        </div>
        <UpgradeDialog organizationId={props.organizationId}>
          {dialogProps => (
            <Button size="sm" class="w-full font-semibold" {...dialogProps}>
              {t('layout.upgrade-cta.button')}
              <div class="i-tabler-arrow-right size-4 ml-1"></div>
            </Button>
          )}
        </UpgradeDialog>
      </div>
    </Show>

  );
};

const OrganizationLayoutSideNav: Component = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { t } = useI18n();

  const getMainMenuItems = () => [
    {
      label: t('layout.menu.home'),
      icon: 'i-tabler-home',
      href: `/organizations/${params.organizationId}`,
    },
    {
      label: t('layout.menu.documents'),
      icon: 'i-tabler-file-text',
      href: `/organizations/${params.organizationId}/documents`,
    },

    {
      label: t('layout.menu.tags'),
      icon: 'i-tabler-tag',
      href: `/organizations/${params.organizationId}/tags`,
    },
    {
      label: t('layout.menu.tagging-rules'),
      icon: 'i-tabler-list-check',
      href: `/organizations/${params.organizationId}/tagging-rules`,
    },
    {
      label: t('layout.menu.members'),
      icon: 'i-tabler-users',
      href: `/organizations/${params.organizationId}/members`,
    },
  ];

  const getFooterMenuItems = () => [
    {
      label: t('layout.menu.deleted-documents'),
      icon: 'i-tabler-trash',
      href: `/organizations/${params.organizationId}/deleted`,
    },
    {
      label: t('layout.menu.organization-settings'),
      icon: 'i-tabler-settings',
      href: `/organizations/${params.organizationId}/settings`,
    },
  ];

  const organizationsQuery = useQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  const organizationQuery = useQuery(() => ({
    queryKey: ['organizations', params.organizationId],
    queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
  }));

  createEffect(on(
    () => organizationQuery.error,
    (error) => {
      if (error) {
        const status = get(error, 'status');

        if (status && [
          400, // when the id of the organization is not valid
          403, // when the user does not have access to the organization or the organization does not exist
        ].includes(status)) {
          navigate('/');
        }
      }
    },
  ));

  return (
    <SideNav
      mainMenu={getMainMenuItems()}
      footerMenu={getFooterMenuItems()}
      footer={() => <UpgradeCTAFooter organizationId={params.organizationId} />}
      header={() =>
        (
          <div class="px-6 pt-4 max-w-285px min-w-0">
            <Select
              options={[...organizationsQuery.data?.organizations ?? [], { id: 'create' }]}
              optionValue="id"
              optionTextValue="name"
              value={organizationsQuery.data?.organizations.find(organization => organization.id === params.organizationId)}
              onChange={(value) => {
                if (!value || value.id === params.organizationId) {
                  return;
                }

                return value && (
                  value.id === 'create'
                    ? navigate('/organizations/create')
                    : navigate(`/organizations/${value.id}`));
              }}
              itemComponent={props => props.item.rawValue.id === 'create'
                ? (
                    <SelectItem class="cursor-pointer" item={props.item}>
                      <div class="flex items-center gap-2 text-muted-foreground">
                        <div class="i-tabler-plus size-4"></div>
                        <div>Create new organization</div>
                      </div>
                    </SelectItem>
                  )
                : (
                    <SelectItem class="cursor-pointer" item={props.item}>{props.item.rawValue.name}</SelectItem>
                  )}
            >
              <SelectTrigger>
                <SelectValue<Organization | undefined> class="truncate">
                  {state => state.selectedOption()?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent />
            </Select>

          </div>
        )}
    />

  );
};

export const OrganizationLayout: ParentComponent = (props) => {
  const params = useParams();
  const navigate = useNavigate();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId],
    queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
  }));

  createEffect(on(
    () => query.error,
    (error) => {
      if (error) {
        const status = get(error, 'status');

        if (status && [401, 403].includes(status)) {
          navigate('/');
        }
      }
    },
  ));

  return (
    <DocumentUploadProvider>
      <SidenavLayout
        children={props.children}
        sideNav={OrganizationLayoutSideNav}
      />
    </DocumentUploadProvider>
  );
};
