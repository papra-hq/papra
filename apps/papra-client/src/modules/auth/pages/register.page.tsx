import type { Component } from 'solid-js';
import type { SsoProviderConfig } from '../auth.types';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { getEnabledSsoProviderConfigs } from '../auth.models';
import { authWithProvider, signUp } from '../auth.services';
import { AuthLegalLinks } from '../components/legal-links.component';
import { SsoProviderButton } from '../components/sso-provider-button.component';

export const EmailRegisterForm: Component = () => {
  const { config } = useConfig();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { form, Form, Field } = createForm({
    onSubmit: async ({ email, password, name }) => {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: config.baseUrl,
      });

      if (error) {
        throw error;
      }

      if (config.auth.isEmailVerificationRequired) {
        navigate('/email-validation-required');
        return;
      }

      navigate('/');
    },
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty(t('auth.register.form.email.required')),
        v.email(t('auth.register.form.email.invalid')),
      ),
      password: v.pipe(
        v.string(),
        v.nonEmpty(t('auth.register.form.password.required')),
        v.minLength(8, t('auth.register.form.password.min-length', { minLength: 8 })),
        v.maxLength(128, t('auth.register.form.password.max-length', { maxLength: 128 })),
      ),
      name: v.pipe(
        v.string(t('auth.register.form.name.label')),
        v.nonEmpty(t('auth.register.form.name.required')),
        v.maxLength(64, t('auth.register.form.name.max-length', { maxLength: 64 })),
      ),
    }),
  });

  return (
    <Form>
      <Field name="email">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-5">
            <TextFieldLabel for="email" class="font-medium">{t('auth.register.form.email.label')}</TextFieldLabel>
            <TextField type="email" id="email" placeholder={t('auth.register.form.email.placeholder')} {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-5">
            <TextFieldLabel for="name" class="font-medium">{t('auth.register.form.name.label')}</TextFieldLabel>
            <TextField type="text" id="name" placeholder={t('auth.register.form.name.placeholder')} {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-2 mb-6">
            <TextFieldLabel for="password" class="font-medium">{t('auth.register.form.password.label')}</TextFieldLabel>
            <TextField type="password" id="password" placeholder={t('auth.register.form.password.placeholder')} {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} class="h-11" />
            {field.error && <div class="text-red-500 text-sm mt-1">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full h-11 font-medium" isLoading={form.submitting}>
        {t('auth.register.form.submit')}
      </Button>

      <Show when={form.response.message}>
        <div class="text-red-500 text-sm mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          {form.response.message}
        </div>
      </Show>
    </Form>
  );
};

export const RegisterPage: Component = () => {
  const { config } = useConfig();
  const { t } = useI18n();

  if (!config.auth.isRegistrationEnabled) {
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
                <div class="inline-flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-2xl mb-4">
                  <div class="i-tabler-shield-x size-8 text-destructive" />
                </div>
                <h1 class="text-2xl font-bold tracking-tight">
                  {t('auth.register.registration-disabled.title')}
                </h1>
                <p class="text-muted-foreground mt-2 text-base">
                  {t('auth.register.registration-disabled.description')}
                </p>
              </div>

              {/* Footer links */}
              <div class="pt-4 border-t">
                <p class="text-center text-sm text-muted-foreground">
                  {t('auth.register.have-account')}
                  {' '}
                  <Button variant="link" as={A} class="inline px-0 text-sm font-medium" href="/login">
                    {t('auth.register.login')}
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const [getShowEmailRegister, setShowEmailRegister] = createSignal(false);

  const registerWithProvider = async (provider: SsoProviderConfig) => {
    await authWithProvider({ provider, config });
  };

  const getHasSsoProviders = () => getEnabledSsoProviderConfigs({ config }).length > 0;

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
                <div class="i-tabler-user-plus size-8 text-primary" />
              </div>
              <h1 class="text-2xl font-bold tracking-tight">
                {t('auth.register.title')}
              </h1>
              <p class="text-muted-foreground mt-2 text-base">
                {t('auth.register.description')}
              </p>
            </div>

            {/* Form content */}
            <div class="space-y-6">
              {getShowEmailRegister() || !getHasSsoProviders()
                ? <EmailRegisterForm />
                : (
                    <Button onClick={() => setShowEmailRegister(true)} class="w-full h-11" variant="outline">
                      <div class="i-tabler-mail mr-2 size-5" />
                      {t('auth.register.register-with-email')}
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
                        onClick={() => registerWithProvider(provider)}
                        label={t('auth.register.register-with-provider', { provider: provider.name })}
                      />
                    )}
                  </For>
                </div>
              </Show>

              {/* Footer links */}
              <div class="pt-4 border-t">
                <p class="text-center text-sm text-muted-foreground">
                  {t('auth.register.have-account')}
                  {' '}
                  <Button variant="link" as={A} class="inline px-0 text-sm font-medium" href="/login">
                    {t('auth.register.login')}
                  </Button>
                </p>

                <div class="mt-4">
                  <AuthLegalLinks />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};
