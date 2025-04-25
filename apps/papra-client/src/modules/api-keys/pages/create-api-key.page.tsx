import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { queryClient } from '@/modules/shared/query/query-client';
import { CopyButton } from '@/modules/shared/utils/copy';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { setValue } from '@modular-forms/solid';
import { A } from '@solidjs/router';
import { createSignal, Show } from 'solid-js';
import * as v from 'valibot';
import { API_KEY_PERMISSIONS_LIST } from '../api-keys.constants';
import { createApiKey } from '../api-keys.services';
import { ApiKeyPermissionsPicker } from '../components/api-key-permissions-picker.component';

export const CreateApiKeyPage: Component = () => {
  const { t } = useI18n();
  const [getToken, setToken] = createSignal<string | null>(null);

  const { form, Form, Field } = createForm({
    onSubmit: async ({ name, permissions }) => {
      const { token } = await createApiKey({
        name,
        permissions,
        organizationIds: [],
        allOrganizations: false,
      });

      await queryClient.invalidateQueries({ queryKey: ['api-keys'] });

      setToken(token);

      createToast({
        type: 'success',
        message: t('api-keys.create.success'),
      });
    },
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.nonEmpty(t('api-keys.create.form.name.required')),
      ),
      permissions: v.pipe(
        v.array(v.picklist(API_KEY_PERMISSIONS_LIST as string[])),
        v.nonEmpty(t('api-keys.create.form.permissions.required')),
      ),
    }),
    initialValues: {
      name: '',
      permissions: API_KEY_PERMISSIONS_LIST,
    },
  });

  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl w-full">
      <div class="border-b pb-4 mb-6">
        <h1 class="text-2xl font-bold">{t('api-keys.create.title')}</h1>
        <p class="text-sm text-muted-foreground">{t('api-keys.create.description')}</p>
      </div>

      <Show when={getToken()}>
        <div class="bg-card border p-6 rounded-md mt-6">
          <h2 class="text-lg font-semibold mb-2">{t('api-keys.create.created.title')}</h2>
          <p class="text-sm text-muted-foreground mb-4">{t('api-keys.create.created.description')}</p>

          <TextFieldRoot class="flex items-center gap-2 space-y-0">
            <TextField type="text" placeholder={t('api-keys.create.form.name.placeholder')} value={getToken() ?? ''} />
            <CopyButton text={getToken() ?? ''} />
          </TextFieldRoot>
        </div>

        <div class="flex justify-end mt-6">
          <Button type="button" variant="secondary" as={A} href="/api-keys">
            {t('api-keys.create.back')}
          </Button>
        </div>
      </Show>

      <Show when={!getToken()}>
        <Form>
          <Field name="name">
            {(field, inputProps) => (

              <TextFieldRoot class="flex flex-col mb-6">
                <TextFieldLabel for="name">{t('api-keys.create.form.name.label')}</TextFieldLabel>
                <TextField type="text" id="name" placeholder={t('api-keys.create.form.name.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
                {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
              </TextFieldRoot>

            )}
          </Field>

          <Field name="permissions" type="string[]">
            {field => (
              <div>
                <p class="text-sm font-bold">{t('api-keys.create.form.permissions.label')}</p>

                <div class="p-6 pb-8 border rounded-md mt-2">
                  <ApiKeyPermissionsPicker permissions={field.value ?? []} onChange={permissions => setValue(form, 'permissions', permissions)} />
                </div>

                {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
              </div>

            )}
          </Field>

          <div class="flex justify-end mt-6">
            <Button type="submit" isLoading={form.submitting}>
              {t('api-keys.create.form.submit')}
            </Button>
          </div>
        </Form>
      </Show>
    </div>
  );
};
