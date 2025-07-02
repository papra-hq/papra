import type { Component } from 'solid-js';
import type { SsoProviderConfig } from '../auth.types';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import { Separator } from '@/modules/ui/components/separator';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { getEnabledSsoProviderConfigs, isEmailVerificationRequiredError } from '../auth.models';
import { authWithProvider, signIn } from '../auth.services';
import { AuthCard } from '../components/auth-card.component';
import { AuthLegalLinks } from '../components/legal-links.component';
import { SsoProviderButton } from '../components/sso-provider-button.component';

export const EmailLoginForm: Component = () => {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { t } = useI18n();

  const { form, Form, Field } = createForm({
    onSubmit: async ({ email, password, rememberMe }) => {
      const { error } = await signIn.email({ email, password, rememberMe, callbackURL: config.baseUrl });

      if (isEmailVerificationRequiredError({ error })) {
        navigate('/email-validation-required');
      }

      if (error) {
        throw error;
      }
    },
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('auth.login.form.email.required')),
        v.email(t('auth.login.form.email.invalid')),
      ),
      password: v.pipe(
        v.string(t('auth.login.form.password.required')),
        v.nonEmpty(t('auth.login.form.password.required')),
      ),
      rememberMe: v.boolean(),
    }),
    initialValues: {
      rememberMe: true,
    },
  });

  return (
    <Form>
      <Field name="email">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-5">
            <TextFieldLabel for="email" class="font-medium">{t('auth.login.form.email.label')}</TextFieldLabel>
            <TextField type="email" id="email" placeholder={t('auth.login.form.email.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-5">
            <TextFieldLabel for="password" class="font-medium">{t('auth.login.form.password.label')}</TextFieldLabel>
            <TextField type="password" id="password" placeholder={t('auth.login.form.password.placeholder')} {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex justify-between items-center mb-6">
        <Field name="rememberMe" type="boolean">
          {(field, inputProps) => (
            <Checkbox class="flex items-center gap-2" defaultChecked={field.value}>
              <CheckboxControl inputProps={inputProps} />
              <CheckboxLabel class="text-sm font-medium leading-none">
                {t('auth.login.form.remember-me.label')}
              </CheckboxLabel>
            </Checkbox>
          )}
        </Field>

        <Show when={config.auth.isPasswordResetEnabled}>
          <Button variant="link" as={A} class="inline p-0! h-auto text-sm" href="/request-password-reset">
            {t('auth.login.form.forgot-password.label')}
          </Button>
        </Show>
      </div>

      <Button type="submit" class="w-full h-11 font-medium" isLoading={form.submitting}>
        {t('auth.login.form.submit')}
      </Button>

      <Show when={form.response.message}>
        <div class="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          {form.response.message}
        </div>
      </Show>
    </Form>
  );
};

export const LoginPage: Component = () => {
  const { config } = useConfig();
  const { t } = useI18n();

  const [getShowEmailLogin, setShowEmailLogin] = createSignal(false);

  const loginWithProvider = async (provider: SsoProviderConfig) => {
    await authWithProvider({ provider, config });
  };

  const getHasSsoProviders = () => getEnabledSsoProviderConfigs({ config }).length > 0;

  return (
    <AuthCard
      icon="i-tabler-shield-lock"
      title={t('auth.login.title')}
      description={t('auth.login.description')}
    >
      {/* Form content */}
      <div class="space-y-6">
        {getShowEmailLogin() || !getHasSsoProviders()
          ? <EmailLoginForm />
          : (
              <Button onClick={() => setShowEmailLogin(true)} class="w-full h-11" variant="outline">
                <div class="i-tabler-mail mr-2 size-5" />
                {t('auth.login.login-with-provider', { provider: 'Email' })}
              </Button>
            )}

        <Show when={getHasSsoProviders()}>
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <Separator class="w-full" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-card text-muted-foreground">or continue with</span>
            </div>
          </div>

          <div class="space-y-3">
            <For each={getEnabledSsoProviderConfigs({ config })}>
              {provider => (
                <SsoProviderButton
                  name={provider.name}
                  icon={provider.icon}
                  onClick={() => loginWithProvider(provider)}
                  label={t('auth.login.login-with-provider', { provider: provider.name })}
                />
              )}
            </For>
          </div>
        </Show>

        {/* Footer links */}
        <div class="pt-4 border-t">
          <p class="text-center text-sm text-muted-foreground">
            {t('auth.login.no-account')}
            {' '}
            <Button variant="link" as={A} class="inline px-0 text-sm font-medium" href="/register">
              {t('auth.login.register')}
            </Button>
          </p>

          <div class="mt-4">
            <AuthLegalLinks />
          </div>
        </div>
      </div>
    </AuthCard>
  );
};
