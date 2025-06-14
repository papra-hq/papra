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
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { forgetPassword } from '../auth.services';
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
    <AuthLayout>
      <div class="flex items-center justify-center min-h-full p-6 sm:pb-32">
        {/* Background decoration */}
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
        <div class="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div class="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />
        
        <div class="relative w-full max-w-md">
          {/* Main card */}
          <div class="bg-card border shadow-xl rounded-2xl p-8 backdrop-blur-sm">
            {/* Icon and header */}
            <div class="text-center mb-8">
              <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                <div class="i-tabler-key size-8 text-primary" />
              </div>
              <h1 class="text-2xl font-bold tracking-tight">
                {t('auth.request-password-reset.title')}
              </h1>
              <p class="text-muted-foreground mt-2 text-base">
                {getHasPasswordResetBeenRequested()
                  ? t('auth.request-password-reset.requested')
                  : t('auth.request-password-reset.description')}
              </p>
            </div>

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
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
