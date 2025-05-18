import type { Component, ParentComponent } from 'solid-js';

import type { Organization } from '@/modules/organizations/organizations.types';

import { useNavigate, useParams } from '@solidjs/router';
import { createQueries, createQuery } from '@tanstack/solid-query';
import { get } from 'lodash-es';
import { createEffect, on } from 'solid-js';
import { DocumentUploadProvider } from '@/modules/documents/components/document-import-status.component';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { fetchOrganization, fetchOrganizations } from '@/modules/organizations/organizations.services';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { SideNav, SidenavLayout } from './sidenav.layout';

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

  const queries = createQueries(() => ({
    queries: [
      {
        queryKey: ['organizations'],
        queryFn: fetchOrganizations,
      },
      {
        queryKey: ['organizations', params.organizationId],
        queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
      },
    ],
  }));

  createEffect(on(
    () => queries[1].error,
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
      header={() =>
        (
          <div class="px-6 pt-4 max-w-285px min-w-0">
            <Select
              options={[...queries[0].data?.organizations ?? [], { id: 'create' }]}
              optionValue="id"
              optionTextValue="name"
              value={queries[0].data?.organizations.find(organization => organization.id === params.organizationId)}
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
                <SelectValue<Organization> class="truncate">
                  {state => state.selectedOption().name}
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

  const query = createQuery(() => ({
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
