import type { Component } from 'solid-js';
import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router';
import { createSignal, onMount } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { resetPassword } from '../auth.services';

export const ResetPasswordForm: Component<{ onSubmit: (args: { newPassword: string }) => Promise<void> }> = (props) => {
  const { t } = useI18n();

  const { form, Form, Field } = createForm({
    onSubmit: props.onSubmit,
    schema: v.object({
      newPassword: v.pipe(
        v.string(),
        v.nonEmpty(t('auth.reset-password.form.new-password.required')),
        v.minLength(8, t('auth.reset-password.form.new-password.min-length', { minLength: 8 })),
        v.maxLength(128, t('auth.reset-password.form.new-password.max-length', { maxLength: 128 })),
      ),
    }),
  });

  return (
    <Form>
      <Field name="newPassword">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="newPassword">{t('auth.reset-password.form.new-password.label')}</TextFieldLabel>
            <TextField type="password" id="newPassword" placeholder={t('auth.reset-password.form.new-password.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">
        {t('auth.reset-password.form.submit')}
      </Button>

      <div class="text-red-500 text-sm mt-2">{form.response.message}</div>

    </Form>
  );
};

export const ResetPasswordPage: Component = () => {
  const [getHasPasswordBeenReset, setHasPasswordBeenReset] = createSignal(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.token;

  const { t } = useI18n();

  if (!token || typeof token !== 'string') {
    return <Navigate href="/login" />;
  }

  const { config } = useConfig();
  const navigate = useNavigate();

  onMount(() => {
    if (!config.auth.isPasswordResetEnabled || !config.auth.providers.email.isEnabled) {
      navigate('/login');
    }
  });

  const onPasswordResetRequested = async ({ newPassword }: { newPassword: string }) => {
    const { error } = await resetPassword({
      newPassword,
      token,
    });

    if (error) {
      throw error;
    }

    setHasPasswordBeenReset(true);
  };

  return (
    <AuthLayout>
      <div class="flex items-center justify-center p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            {t('auth.reset-password.title')}
          </h1>

          {getHasPasswordBeenReset()
            ? (
                <>
                  <div class="text-muted-foreground mt-1 mb-4">
                    {t('auth.reset-password.reset')}
                  </div>

                  <Button as={A} href="/login" class="w-full">
                    {t('auth.reset-password.back-to-login')}
                    <div class="i-tabler-login-2 ml-2 size-4" />
                  </Button>
                </>
              )
            : (
                <>
                  <p class="text-muted-foreground mt-1 mb-4">
                    {t('auth.reset-password.description')}
                  </p>

                  <ResetPasswordForm onSubmit={onPasswordResetRequested} />
                </>
              )}

        </div>
      </div>
    </AuthLayout>
  );
};
