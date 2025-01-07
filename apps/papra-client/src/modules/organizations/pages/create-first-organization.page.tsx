import type { Component } from 'solid-js';
import { useCurrentUser } from '@/modules/users/composables/useCurrentUser';
import { CreateOrganizationForm } from '../components/create-organization-form.component';
import { useCreateOrganization } from '../organizations.composables';

export const CreateFirstOrganizationPage: Component = () => {
  const { createOrganization } = useCreateOrganization();
  const { user } = useCurrentUser();

  const getOrganizationName = () => {
    const fullName = user.fullName;

    if (fullName && fullName.length > 0) {
      return `${fullName}'s organization`;
    }

    return `My organization`;
  };

  return (
    <div>
      <div class="max-w-md mx-auto sm:mt-16 p-6">
        <h1 class="text-xl font-bold">
          Create your organization
        </h1>

        <p class="text-muted-foreground mb-6">
          Your documents will be grouped by organization. You can create multiple organizations to separate your documents, for your personal use or to collaborate with others.
        </p>

        <CreateOrganizationForm onSubmit={createOrganization} initialOrganizationName={getOrganizationName()} />
      </div>
    </div>
  );
};
