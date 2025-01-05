import type { Component } from 'solid-js';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import * as v from 'valibot';

export const CreateOrganizationForm: Component<{
  onSubmit: (args: { organizationName: string }) => Promise<void>;
  initialOrganizationName?: string;
}> = (props) => {
  const { form, Form, Field } = createForm({
    onSubmit: ({ organizationName }) => props.onSubmit({ organizationName }),
    schema: v.object({
      organizationName: v.pipe(
        v.string('Organization name must be a string'),
        v.minLength(3, 'Organization name must be at least 3 characters'),
        v.maxLength(50, 'Organization name must be at most 50 characters'),
      ),
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
