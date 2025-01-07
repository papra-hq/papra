import type { Component } from 'solid-js';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import * as v from 'valibot';
import { organizationNameSchema } from '../organizations.schemas';

export const CreateOrganizationForm: Component<{
  onSubmit: (args: { organizationName: string }) => Promise<void>;
  initialOrganizationName?: string;
}> = (props) => {
  const { form, Form, Field } = createForm({
    onSubmit: ({ organizationName }) => props.onSubmit({ organizationName }),
    schema: v.object({
      organizationName: organizationNameSchema,
    }),
    initialValues: {
      organizationName: props.initialOrganizationName,
    },
  });

  return (
    <div>
      <Form>
        <Field name="organizationName">
          {(field, inputProps) => (
            <TextFieldRoot class="flex flex-col gap-1 mb-6">
              <TextFieldLabel for="organizationName">Organization name</TextFieldLabel>
              <TextField type="text" id="organizationName" placeholder="Eg. Acme Inc." {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>

        <div class="flex justify-end">
          <Button type="submit" isLoading={form.submitting} class="w-full">
            Create organization
          </Button>
        </div>

        <div class="text-red-500 text-sm mt-4">{form.response.message}</div>
      </Form>
    </div>
  );
};
