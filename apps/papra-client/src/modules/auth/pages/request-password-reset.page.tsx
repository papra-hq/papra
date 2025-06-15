import type { Component } from 'solid-js';
import { buildUrl } from '@corentinth/chisels';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { forgetPassword } from '../auth.services';
import { AuthCard } from '../components/auth-card.component';
import { OpenEmailProvider } from '../components/open-email-provider.component';

export const ResetPasswordForm: Component<{ onSubmit: (args: { email: string }) => Promise<void> }> = (props) => {
  const { t } = useI18n();

  const { form, Form, Field } = createForm({
    onSubmit: props.onSubmit,
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('auth.request-password-reset.form.email.required')),
        v.email(t('auth.request-password-reset.form.email.invalid')),
      ),
    }),
  });

  return (
    <Form>
      <Field name="email">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-6">
            <TextFieldLabel for="email" class="font-medium">{t('auth.request-password-reset.form.email.label')}</TextFieldLabel>
            <TextField type="email" id="email" placeholder={t('auth.request-password-reset.form.email.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full h-11 font-medium" isLoading={form.submitting}>
        {t('auth.request-password-reset.form.submit')}
      </Button>

      <Show when={form.response.message}>
        <div class="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          {form.response.message}
        </div>
      </Show>
    </Form>
  );
};

export const RequestPasswordResetPage: Component = () => {
  const [getHasPasswordResetBeenRequested, setHasPasswordResetBeenRequested] = createSignal(false);
  const [getEmail, setEmail] = createSignal<string | undefined>(undefined);

  const { t } = useI18n();
  const { config } = useConfig();
  const navigate = useNavigate();

  onMount(() => {
    if (!config.auth.isPasswordResetEnabled) {
      navigate('/login');
    }
  });

  const onPasswordResetRequested = async ({ email }: { email: string }) => {
    const { error } = await forgetPassword({
      email,
      redirectTo: buildUrl({
        path: '/reset-password',
        baseUrl: config.baseUrl,
      }),
    });

    if (error) {
      throw error;
    }

    setEmail(email);
    setHasPasswordResetBeenRequested(true);
  };

  return (
    <AuthCard
      icon="i-tabler-key"
      title={t('auth.request-password-reset.title')}
      description={getHasPasswordResetBeenRequested()
        ? t('auth.request-password-reset.requested')
        : t('auth.request-password-reset.description')}
    >
      {/* Form content */}
      <div class="space-y-6">
        {getHasPasswordResetBeenRequested()
          ? (
              <OpenEmailProvider email={getEmail()} variant="secondary" class="w-full" />
            )
          : (
              <ResetPasswordForm onSubmit={onPasswordResetRequested} />
            )}

        {/* Footer */}
        <div class="pt-4 border-t">
          <Button as={A} href="/login" class="w-full h-11" variant={getHasPasswordResetBeenRequested() ? 'default' : 'outline'}>
            <div class="i-tabler-arrow-left mr-2 size-4" />
            {t('auth.request-password-reset.back-to-login')}
          </Button>
        </div>
      </div>
    </AuthCard>
  );
};
