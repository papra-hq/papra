import type { Organization } from '@/modules/organizations/organizations.types';

import { fetchOrganization, fetchOrganizations } from '@/modules/organizations/organizations.services';

import { useNavigate, useParams } from '@solidjs/router';
import { createQueries, createQuery } from '@tanstack/solid-query';
import { get } from 'lodash-es';
import { type Component, createEffect, on, type ParentComponent } from 'solid-js';
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

  const getMainMenuItems = () => [
    {
      label: 'Home',
      icon: 'i-tabler-home',
      href: `/organizations/${params.organizationId}`,
    },
    {
      label: 'Documents',
      icon: 'i-tabler-file-text',
      href: `/organizations/${params.organizationId}/documents`,
    },

    {
      label: 'Tags',
      icon: 'i-tabler-tag',
      href: `/organizations/${params.organizationId}/tags`,
    },
    {
      label: 'Integrations',
      icon: 'i-tabler-link',
      href: `/organizations/${params.organizationId}/intake-emails`,
    },

  ];

  const getFooterMenuItems = () => [
    {
      label: 'Deleted documents',
      icon: 'i-tabler-trash',
      href: `/organizations/${params.organizationId}/deleted`,
    },
    {
      label: 'Organization settings',
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
    <SidenavLayout
      children={props.children}
      sideNav={OrganizationLayoutSideNav}
    />
  );
};
