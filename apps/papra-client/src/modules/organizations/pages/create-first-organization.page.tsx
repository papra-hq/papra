import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { type Component, createEffect, on } from 'solid-js';
import { CreateOrganizationForm } from '../components/create-organization-form.component';
import { useCreateOrganization } from '../organizations.composables';
import { fetchOrganizations } from '../organizations.services';

export const CreateFirstOrganizationPage: Component = () => {
  const { createOrganization } = useCreateOrganization();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  const getOrganizationName = () => {
    const fullName = user.fullName;

    if (fullName && fullName.length > 0) {
      return `${fullName}'s organization`;
    }

    return `My organization`;
  };

  const queries = createQuery(() => ({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  }));

  createEffect(on(
    () => queries.data?.organizations,
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
          Create your organization
        </h1>

        <p class="text-muted-foreground mb-6">
          Your documents will be grouped by organization. You can create multiple organizations to separate your documents, for example, for personal and work documents.
        </p>

        <CreateOrganizationForm onSubmit={createOrganization} initialOrganizationName={getOrganizationName()} />
      </div>
    </div>
  );
};
