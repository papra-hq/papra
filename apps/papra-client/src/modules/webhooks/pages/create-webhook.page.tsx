import type { Component } from 'solid-js';
import { setValue } from '@modular-forms/solid';
import { A, useNavigate, useParams } from '@solidjs/router';
import * as v from 'valibot';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { WebhookEventsPicker } from '../components/webhook-events-picker.component';
import { WEBHOOK_EVENT_NAMES } from '../webhooks.constants';
import { createWebhook } from '../webhooks.services';

export const CreateWebhookPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();

  const { form, Form, Field } = createForm({
    onSubmit: async ({ name, url, secret, enabled, events }) => {
      await createWebhook({
        name,
        url,
        secret,
        enabled,
        events,
        organizationId: params.organizationId,
      });

      await queryClient.invalidateQueries({ queryKey: ['webhooks', params.organizationId] });

      createToast({
        type: 'success',
        message: t('webhooks.create.success'),
      });

      navigate(`/organizations/${params.organizationId}/settings/webhooks`);
    },
    schema: v.object({
      name: v.pipe(
        v.string(),
        v.nonEmpty(t('webhooks.create.form.name.required')),
      ),
      url: v.pipe(
        v.string(),
        v.nonEmpty(t('webhooks.create.form.url.required')),
        v.url(t('webhooks.create.form.url.invalid')),
      ),
      secret: v.optional(v.string()),
      enabled: v.optional(v.boolean()),
      events: v.pipe(
        v.array(v.picklist(WEBHOOK_EVENT_NAMES)),
        v.nonEmpty(t('webhooks.create.form.events.required')),
      ),
    }),
    initialValues: {
      name: '',
      url: '',
      secret: '',
      enabled: true,
      events: [],
    },
  });

  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl w-full">
      <div class="border-b pb-4 mb-6">
        <h1 class="text-2xl font-bold">{t('webhooks.create.title')}</h1>
        <p class="text-sm text-muted-foreground">{t('webhooks.create.description')}</p>
      </div>

      <Form>
        <Field name="name">
          {(field, inputProps) => (
            <TextFieldRoot class="flex flex-col mb-6">
              <TextFieldLabel for="name">{t('webhooks.create.form.name.label')}</TextFieldLabel>
              <TextField
                type="text"
                id="name"
                placeholder={t('webhooks.create.form.name.placeholder')}
                {...inputProps}
                autoFocus
                value={field.value}
                aria-invalid={Boolean(field.error)}
              />
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>

        <Field name="url">
          {(field, inputProps) => (
            <TextFieldRoot class="flex flex-col mb-6">
              <TextFieldLabel for="url">{t('webhooks.create.form.url.label')}</TextFieldLabel>
              <TextField
                type="url"
                id="url"
                placeholder={t('webhooks.create.form.url.placeholder')}
                {...inputProps}
                value={field.value}
                aria-invalid={Boolean(field.error)}
              />
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>

        <Field name="secret">
          {(field, inputProps) => (
            <TextFieldRoot class="flex flex-col mb-6">
              <TextFieldLabel for="secret">{t('webhooks.create.form.secret.label')}</TextFieldLabel>
              <TextField
                type="password"
                id="secret"
                placeholder={t('webhooks.create.form.secret.placeholder')}
                {...inputProps}
                value={field.value}
                aria-invalid={Boolean(field.error)}
              />
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>

        <Field name="events" type="string[]">
          {field => (
            <div>
              <p class="text-sm font-bold">{t('webhooks.create.form.events.label')}</p>

              <div class="p-6 pb-8 border rounded-md mt-2">
                <WebhookEventsPicker events={field.value ?? []} onChange={events => setValue(form, 'events', events)} />
              </div>

              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </div>
          )}
        </Field>

        <div class="flex justify-end mt-6">
          <Button type="button" variant="secondary" as={A} href={`/organizations/${params.organizationId}/settings/webhooks`}>
            {t('webhooks.create.back')}
          </Button>
          <Button type="submit" class="ml-2" isLoading={form.submitting}>
            {t('webhooks.create.form.submit')}
          </Button>
        </div>
      </Form>
    </div>
  );
};
