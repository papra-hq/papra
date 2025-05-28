import type { Component } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useQuery } from '@tanstack/solid-query';
import { createEffect, on } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { CreateOrganizationForm } from '../components/create-organization-form.component';
import { useCreateOrganization } from '../organizations.composables';
import { fetchOrganizations } from '../organizations.services';

export const CreateFirstOrganizationPage: Component = () => {
  const { createOrganization } = useCreateOrganization();
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { t } = useI18n();

  const getOrganizationName = () => {
    const { name } = user;

    if (name && name.length > 0) {
      return t('organizations.create-first.user-name', { name });
    }

    return t('organizations.create-first.default-name');
  };

  const query = useQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  createEffect(on(
    () => query.data?.organizations,
    (orgs) => {
      if (orgs && orgs.length > 0) {
        navigate('/organizations/create');
      }
    },
  ));

  return (
    <div>
      <div class="max-w-md mx-auto pt-12 sm:pt-24 px-6">
        <h1 class="text-xl font-bold">
          {t('organizations.create-first.title')}
        </h1>

        <p class="text-muted-foreground mb-6">
          {t('organizations.create-first.description')}
        </p>

        <CreateOrganizationForm onSubmit={createOrganization} initialOrganizationName={getOrganizationName()} />
      </div>
    </div>
  );
};
