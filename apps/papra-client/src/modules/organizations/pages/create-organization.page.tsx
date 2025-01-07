import type { Component } from 'solid-js';
import { Button } from '@/modules/ui/components/button';
import { A } from '@solidjs/router';
import { CreateOrganizationForm } from '../components/create-organization-form.component';
import { useCreateOrganization } from '../organizations.composables';

export const CreateOrganizationPage: Component = () => {
  const { createOrganization } = useCreateOrganization();

  return (
    <div>
      <div class="max-w-md mx-auto sm:mt-16 p-6">

        <Button as={A} href="/" class="mb-4" variant="outline">
          <div class="i-tabler-arrow-left mr-2"></div>
          Back
        </Button>

        <h1 class="text-xl font-bold">
          Create a new organization
        </h1>

        <p class="text-muted-foreground mb-6">
          Your documents will be grouped by organization. You can create multiple organizations to separate your documents.
        </p>

        <CreateOrganizationForm onSubmit={createOrganization} />
      </div>
    </div>
  );
};
