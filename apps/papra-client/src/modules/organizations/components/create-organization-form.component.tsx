import type { Component } from 'solid-js';
import { safely } from '@corentinth/chisels';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { isHttpErrorWithCode } from '@/modules/shared/http/http-errors';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { organizationNameSchema } from '../organizations.schemas';

export const CreateOrganizationForm: Component<{
  onSubmit: (args: { organizationName: string }) => Promise<void>;
  initialOrganizationName?: string;
}> = (props) => {
  const { t } = useI18n();
  const { form, Form, Field } = createForm({
    onSubmit: async ({ organizationName }) => {
      const [, error] = await safely(props.onSubmit({ organizationName }));

      if (isHttpErrorWithCode({ error, code: 'user.max_organization_count_reached' })) {
        throw new Error(t('organizations.create.error.max-count-reached'));
      }

      throw error;
    },
    schema: v.object({
      organizationName: v.pipe(
        organizationNameSchema,
        v.nonEmpty(t('organizations.create.form.name.required')),
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
              <TextFieldLabel for="organizationName">{t('organizations.create.form.name.label')}</TextFieldLabel>
              <TextField type="text" id="organizationName" placeholder={t('organizations.create.form.name.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>

        <div class="flex justify-end">
          <Button type="submit" isLoading={form.submitting} class="w-full">
            {t('organizations.create.form.submit')}
          </Button>
        </div>

        <div class="text-red-500 text-sm mt-4">{form.response.message}</div>
      </Form>
    </div>
  );
};
