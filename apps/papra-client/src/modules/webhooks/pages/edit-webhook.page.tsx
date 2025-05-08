import type { Component } from 'solid-js';
import type { Webhook } from '../webhooks.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { setValue } from '@modular-forms/solid';
import { A, useNavigate, useParams } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { createSignal, Show, Suspense } from 'solid-js';
import * as v from 'valibot';
import { WebhookEventsPicker } from '../components/webhook-events-picker.component';
import { WEBHOOK_EVENT_NAMES } from '../webhooks.constants';
import { fetchWebhook, updateWebhook } from '../webhooks.services';

export const EditWebhookForm: Component<{ webhook: Webhook }> = (props) => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();
  const [rotateSecret, setRotateSecret] = createSignal(false);

  const { form, Form, Field } = createForm({
    onSubmit: async ({ name, url, secret, enabled, events }) => {
      const updateData = {
        name,
        url,
        enabled,
        events,
      };

      // Only include secret if rotation was requested
      if (rotateSecret() && secret) {
        Object.assign(updateData, { secret });
      }

      await updateWebhook({
        webhookId: params.webhookId,
        organizationId: params.organizationId,
        input: updateData,
      });

      await queryClient.invalidateQueries({ queryKey: ['webhooks', params.organizationId] });
      await queryClient.invalidateQueries({ queryKey: ['webhook', params.organizationId, params.webhookId] });

      createToast({
        type: 'success',
        message: t('webhooks.update.success'),
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
      name: props.webhook.name,
      url: props.webhook.url,
      enabled: props.webhook.enabled,
      events: props.webhook.events,
    },
  });

  return (

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

      <div class="mb-6">
        <Field name="secret">
          {(field, inputProps) => (
            <TextFieldRoot class="flex flex-col mt-4">
              <TextFieldLabel for="secret">{t('webhooks.create.form.secret.label')}</TextFieldLabel>
              <div class="flex items-center gap-2">
                <TextField
                  type="password"
                  id="secret"
                  placeholder={rotateSecret() ? t('webhooks.update.form.secret.placeholder') : t('webhooks.update.form.secret.placeholder-redacted')}
                  {...inputProps}
                  value={field.value}
                  aria-invalid={Boolean(field.error)}
                  disabled={!rotateSecret()}
                />
                <Show when={!rotateSecret()}>
                  <Button type="button" variant="secondary" onClick={() => setRotateSecret(true)} class="flex-shrink-0">
                    {t('webhooks.update.form.rotate-secret.button')}
                  </Button>
                </Show>
              </div>
              {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
            </TextFieldRoot>
          )}
        </Field>
      </div>

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
          {t('webhooks.update.cancel')}
        </Button>
        <Button type="submit" class="ml-2" isLoading={form.submitting}>
          {t('webhooks.update.submit')}
        </Button>
      </div>
    </Form>
  );
};

export const EditWebhookPage: Component = () => {
  const { t } = useI18n();
  const params = useParams();

  const webhookQuery = createQuery(() => ({
    queryKey: ['webhook', params.organizationId, params.webhookId],
    queryFn: () => fetchWebhook({
      organizationId: params.organizationId,
      webhookId: params.webhookId,
    }),
  }));

  return (
    <div class="p-6 mt-12 pb-32 mx-auto max-w-xl w-full">
      <div class="border-b pb-4 mb-6">
        <h1 class="text-2xl font-bold">{t('webhooks.update.title')}</h1>
        <p class="text-sm text-muted-foreground">{t('webhooks.update.description')}</p>
      </div>

      <Suspense>
        <Show when={webhookQuery.data?.webhook}>
          {getWebhook => <EditWebhookForm webhook={getWebhook()} />}
        </Show>
      </Suspense>
    </div>
  );
};
