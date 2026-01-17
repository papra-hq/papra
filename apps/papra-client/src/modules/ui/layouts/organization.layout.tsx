import type { Component, ParentComponent } from 'solid-js';

import type { Organization } from '@/modules/organizations/organizations.types';

import { useNavigate, useParams } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createEffect, on, Show } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { DocumentUploadProvider } from '@/modules/documents/components/document-import-status.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganization, fetchOrganizations } from '@/modules/organizations/organizations.services';
import { queryClient } from '@/modules/shared/query/query-client';
import { getErrorStatus } from '@/modules/shared/utils/errors';
import { UpgradeDialog } from '@/modules/subscriptions/components/upgrade-dialog.component';
import { fetchOrganizationSubscription } from '@/modules/subscriptions/subscriptions.services';
import { SideNav } from '@/modules/ui/components/sidenav';
import { Button } from '../components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { SidenavLayout } from './sidenav.layout';

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
    <div>
      <Show when={shouldShowUpgradeCTA()}>

        <div class="p-4 mx-4 mt-4 bg-background bg-gradient-to-br from-primary/15 to-transparent rounded-lg">
          <div class="flex items-center gap-2 text-sm font-medium">
            <div class="i-tabler-sparkles size-4 text-primary" />
            {t('layout.upgrade-cta.title')}
          </div>
          <div class="text-xs mt-1 mb-3 text-muted-foreground">
            {t('layout.upgrade-cta.description')}
          </div>
          <UpgradeDialog organizationId={props.organizationId}>
            {dialogProps => (
              <Button size="sm" class="w-full font-semibold" {...dialogProps}>
                {t('layout.upgrade-cta.button')}
                <div class="i-tabler-arrow-right size-4 ml-1" />
              </Button>
            )}
          </UpgradeDialog>
        </div>
      </Show>
    </div>
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
        const status = getErrorStatus(error);

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
          <div class="p-4 pb-0 min-w-0 max-w-full">
            <Select
              class="w-full"
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
                        <div class="i-tabler-plus size-4" />
                        <div>Create new organization</div>
                      </div>
                    </SelectItem>
                  )
                : (
                    <SelectItem class="cursor-pointer" item={props.item}>{props.item.rawValue.name}</SelectItem>
                  )}
            >
              <SelectTrigger class="hover:bg-accent/50 transition rounded-lg h-auto pl-2" caretIcon={<div class="i-tabler-chevron-down size-4 opacity-50 ml-2 flex-shrink-0" />}>
                <SelectValue<Organization | undefined> class="flex items-center gap-2 min-w-0">
                  {state => (
                    <>
                      <span class="p-1.5 rounded text-lg font-bold flex items-center bg-muted light:border dark:bg-primary/10 text-primary transition flex-shrink-0">
                        <div class="i-tabler-file-text size-5.5" />
                      </span>

                      <span class="truncate text-base font-medium">
                        {state.selectedOption()?.name}
                      </span>
                    </>
                  )}

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
        const status = getErrorStatus(error);

        if (status && [401, 403].includes(status)) {
          queryClient.invalidateQueries({ queryKey: ['organizations'] });
          navigate('/');
        }
      }
    },
  ));

  return (
    <DocumentUploadProvider organizationId={params.organizationId}>
      <SidenavLayout
        children={props.children}
        sideNav={OrganizationLayoutSideNav}
      />
    </DocumentUploadProvider>
  );
};
