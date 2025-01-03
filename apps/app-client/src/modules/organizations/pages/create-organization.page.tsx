import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A, useNavigate } from '@solidjs/router';
import { type Component, Show } from 'solid-js';
import { z } from 'zod';
import { createOrganization } from '../organizations.services';

export const CreateOrganizationPage: Component = () => {
  const navigate = useNavigate();

  const { getInputBindings, submit, onSubmit, getFieldError, getIsSubmitting } = createForm({
    fields: {
      name: {
        schema: z.string()
          .min(3, 'Organization name must be at least 3 characters')
          .max(50, 'Organization name must be at most 50 characters'),
      },
    },
  });

  onSubmit(async ({ name }) => {
    const { organization } = await createOrganization({ name });

    navigate(`/organizations/${organization.id}`);
  });

  return (
    <div>
      <div class="max-w-lg mx-auto sm:mt-16 p-6">

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

        <form onSubmit={submit}>
          <TextFieldRoot class="flex flex-col gap-1 mb-6">
            <TextFieldLabel for="name">Organization name</TextFieldLabel>
            <TextField type="text" id="name" placeholder="Eg. Acme Inc." {...getInputBindings('name')} />
            <Show when={getFieldError('name')}>{getErrorMessage => <div class="text-red-500 text-sm">{getErrorMessage()}</div>}</Show>
          </TextFieldRoot>

          <Button onClick={submit} isLoading={getIsSubmitting()} type="submit">
            Create organization
          </Button>
        </form>
      </div>
    </div>
  );
};
