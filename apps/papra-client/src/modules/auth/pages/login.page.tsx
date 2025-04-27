import type { Component } from 'solid-js';
import type { SsoProviderKey } from '../auth.types';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Checkbox, CheckboxControl, CheckboxLabel } from '@/modules/ui/components/checkbox';
import { Separator } from '@/modules/ui/components/separator';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { getEnabledSsoProviderConfigs, isEmailVerificationRequiredError } from '../auth.models';
import { signIn } from '../auth.services';
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
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="email">{t('auth.login.form.email.label')}</TextFieldLabel>
            <TextField type="email" id="email" placeholder={t('auth.login.form.email.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="password">{t('auth.login.form.password.label')}</TextFieldLabel>

            <TextField type="password" id="password" placeholder={t('auth.login.form.password.placeholder')} {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <div class="flex justify-between items-center mb-4">
        <Field name="rememberMe" type="boolean">
          {(field, inputProps) => (
            <Checkbox class="flex items-center gap-2" defaultChecked={field.value}>
              <CheckboxControl inputProps={inputProps} />
              <CheckboxLabel class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t('auth.login.form.remember-me.label')}
              </CheckboxLabel>
            </Checkbox>
          )}
        </Field>

        <Button variant="link" as={A} class="inline p-0! h-auto" href="/request-password-reset">
          {t('auth.login.form.forgot-password.label')}
        </Button>
      </div>

      <Button type="submit" class="w-full">{t('auth.login.form.submit')}</Button>

      <div class="text-red-500 text-sm mt-4">{form.response.message}</div>

    </Form>
  );
};

export const LoginPage: Component = () => {
  const { config } = useConfig();
  const { t } = useI18n();

  const [getShowEmailLogin, setShowEmailLogin] = createSignal(false);

  const loginWithProvider = async (provider: { key: SsoProviderKey }) => {
    await signIn.social({ provider: provider.key, callbackURL: config.baseUrl });
  };

  const getHasSsoProviders = () => getEnabledSsoProviderConfigs({ config }).length > 0;

  return (
    <AuthLayout>
      <div class="flex items-center justify-center h-full p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">{t('auth.login.title')}</h1>
          <p class="text-muted-foreground mt-1 mb-4">{t('auth.login.description')}</p>

          {getShowEmailLogin() || !getHasSsoProviders()
            ? <EmailLoginForm />
            : (
                <Button onClick={() => setShowEmailLogin(true)} class="w-full">
                  <div class="i-tabler-mail mr-2 size-4.5" />
                  {t('auth.login.login-with-provider', { provider: 'Email' })}
                </Button>
              )}

          <Show when={getHasSsoProviders()}>
            <Separator class="my-4" />

            <div class="flex flex-col gap-2">
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

          <p class="text-muted-foreground mt-4">
            {t('auth.login.no-account')}
            {' '}
            <Button variant="link" as={A} class="inline px-0" href="/register">
              {t('auth.login.register')}
            </Button>
          </p>

          <AuthLegalLinks />
        </div>
      </div>
    </AuthLayout>
  );
};
