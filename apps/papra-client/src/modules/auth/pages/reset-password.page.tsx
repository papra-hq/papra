import type { Component } from 'solid-js';
import { A, Navigate, useNavigate, useSearchParams } from '@solidjs/router';
import { createSignal, onMount, Show } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { resetPassword } from '../auth.services';
import { AuthCard } from '../components/auth-card.component';

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
          <TextFieldRoot class="flex flex-col gap-2 mb-6">
            <TextFieldLabel for="newPassword" class="font-medium">{t('auth.reset-password.form.new-password.label')}</TextFieldLabel>
            <TextField type="password" id="newPassword" placeholder={t('auth.reset-password.form.new-password.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full h-11 font-medium" isLoading={form.submitting}>
        {t('auth.reset-password.form.submit')}
      </Button>

      <Show when={form.response.message}>
        <div class="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          {form.response.message}
        </div>
      </Show>
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
    if (!config.auth.isPasswordResetEnabled) {
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
    <AuthCard
      icon={getHasPasswordBeenReset() ? 'i-tabler-check' : 'i-tabler-lock-open'}
      title={t('auth.reset-password.title')}
      description={getHasPasswordBeenReset()
        ? t('auth.reset-password.reset')
        : t('auth.reset-password.description')}
    >
      {/* Form content */}
      <div class="space-y-6">
        {getHasPasswordBeenReset()
          ? (
              <Button as={A} href="/login" class="w-full h-11">
                {t('auth.reset-password.back-to-login')}
                <div class="i-tabler-login-2 ml-2 size-4" />
              </Button>
            )
          : (
              <ResetPasswordForm onSubmit={onPasswordResetRequested} />
            )}
      </div>
    </AuthCard>
  );
};
