import type { Organization } from '../organizations.types';
import { useConfirmModal } from '@/modules/shared/confirm';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/modules/ui/components/card';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { type Component, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { useDeleteOrganization, useUpdateOrganization } from '../organizations.composables';
import { organizationNameSchema } from '../organizations.schemas';
import { fetchOrganization } from '../organizations.services';

const DeleteOrganizationCard: Component<{ organization: Organization }> = (props) => {
  const { deleteOrganization } = useDeleteOrganization();
  const { confirm } = useConfirmModal();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete organization',
      message: 'Are you sure you want to delete this organization? This action cannot be undone, and all data associated with this organization will be permanently removed.',
      confirmButton: {
        text: 'Delete organization',
        variant: 'destructive',
      },
      cancelButton: {
        text: 'Cancel',
      },
    });

    if (confirmed) {
      await deleteOrganization({ organizationId: props.organization.id });

      createToast({ type: 'success', message: 'Organization deleted' });
    }
  };

  return (
    <div>
      <Card class="border-destructive">
        <CardHeader class="border-b">
          <CardTitle>Delete organization</CardTitle>
          <CardDescription>
            Deleting this organization will permanently remove all data associated with it.
          </CardDescription>
        </CardHeader>

        <CardFooter class="pt-6">
          <Button onClick={handleDelete} variant="destructive">
            Delete organization
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

const UpdateOrganizationNameCard: Component<{ organization: Organization }> = (props) => {
  const { updateOrganization } = useUpdateOrganization();

  const { form, Form, Field } = createForm({
    schema: v.object({
      organizationName: organizationNameSchema,
    }),
    initialValues: {
      organizationName: props.organization.name,
    },
    onSubmit: async ({ organizationName }) => {
      await updateOrganization({
        organizationId: props.organization.id,
        organizationName: organizationName.trim(),
      });

      createToast({ type: 'success', message: 'Organization name updated' });
    },
  });

  return (
    <div>
      <Card>
        <CardHeader class="border-b">
          <CardTitle>Organization name</CardTitle>

        </CardHeader>

        <Form>
          <CardContent class="pt-6 ">

            <Field name="organizationName">
              {(field, inputProps) => (
                <TextFieldRoot class="flex flex-col gap-1">
                  <TextFieldLabel for="organizationName" class="sr-only">
                    Organization name
                  </TextFieldLabel>
                  <div class="flex gap-2 flex-col sm:flex-row">
                    <TextField type="text" id="organizationName" placeholder="Eg. Acme Inc." {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />

                    <Button type="submit" isLoading={form.submitting} class="flex-shrink-0" disabled={field.value?.trim() === props.organization.name}>
                      Update name
                    </Button>
                  </div>
                  {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
                </TextFieldRoot>
              )}
            </Field>

            <div class="text-red-500 text-sm">{form.response.message}</div>
          </CardContent>

        </Form>
      </Card>
    </div>
  );
};

export const OrganizationsSettingsPage: Component = () => {
  const params = useParams();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId],
    queryFn: () => fetchOrganization({ organizationId: params.organizationId }),
  }));

  return (
    <div class="p-6 mt-4 pb-32 mx-auto max-w-xl">
      <Suspense>
        <Show when={query.data?.organization}>
          { getOrganization => (
            <>
              <h1 class="text-xl font-semibold mb-2">
                Organization settings
              </h1>

              <p class="text-muted-foreground">
                Manage your organization settings here.
              </p>

              <div class="mt-6 flex flex-col gap-6">
                <UpdateOrganizationNameCard organization={getOrganization()} />
                <DeleteOrganizationCard organization={getOrganization()} />
              </div>
            </>
          )}
        </Show>
      </Suspense>
    </div>
  );
};
