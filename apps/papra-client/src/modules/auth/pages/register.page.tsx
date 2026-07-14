import type { Component } from 'solid-js';
import type { SsoProviderConfig } from '../auth.types';
import { buildUrl } from '@corentinth/chisels';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createForm } from '@/modules/shared/form/form';
import { useI18nApiErrors } from '@/modules/shared/http/composables/i18n-api-errors';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { authPagesPaths } from '../auth.constants';
import { getEnabledSsoProviderConfigs } from '../auth.models';
import { authWithProvider, signUp } from '../auth.services';
import { AuthLegalLinks } from '../components/legal-links.component';
import { NoAuthProviderWarning } from '../components/no-auth-provider';
import { SsoProviderButton } from '../components/sso-provider-button.component';
import { useAuthRedirect } from '../composables/use-auth-redirect.composable';

export const EmailRegisterForm: Component = () => {
  const { config } = useConfig();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { createI18nApiError } = useI18nApiErrors({ t });
  const { getPostAuthRedirect, getPathWithRedirect } = useAuthRedirect();

  const { form, Form, Field } = createForm({
    onSubmit: async ({ email, password, name }) => {
      const { error } = await signUp.email({
        email,
        password,
        name,
        callbackURL: buildUrl({
          baseUrl: config.baseUrl,
          path: getPathWithRedirect(authPagesPaths.emailVerification),
        }),
      });

      if (error) {
        throw createI18nApiError({ error });
      }

      if (config.auth.isEmailVerificationRequired) {
        navigate(getPathWithRedirect(authPagesPaths.emailValidationRequired));
        return;
      }

      navigate(getPostAuthRedirect());
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
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="email">{t('auth.register.form.email.label')}</TextFieldLabel>
            <TextField
              type="email"
              id="email"
              placeholder={t('auth.register.form.email.placeholder')}
              {...inputProps}
              autoFocus
              value={field.value}
              aria-invalid={Boolean(field.error)}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">{t('auth.register.form.name.label')}</TextFieldLabel>
            <TextField
              type="text"
              id="name"
              placeholder={t('auth.register.form.name.placeholder')}
              {...inputProps}
              value={field.value}
              aria-invalid={Boolean(field.error)}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="password">{t('auth.register.form.password.label')}</TextFieldLabel>

            <TextField
              type="password"
              id="password"
              placeholder={t('auth.register.form.password.placeholder')}
              {...inputProps}
              value={field.value}
              aria-invalid={Boolean(field.error)}
            />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">
        {t('auth.register.form.submit')}
      </Button>

      <div class="text-red-500 text-sm mt-4">{form.response.message}</div>
    </Form>
  );
};

export const RegisterPage: Component = () => {
  const { config } = useConfig();
  const { t } = useI18n();
  const { getRedirectPath, getLoginPathWithRedirect } = useAuthRedirect();

  if (!config.auth.isRegistrationEnabled) {
    return (
      <AuthLayout>
        <div class="flex items-center justify-center h-full p-6 sm:pb-32">
          <div class="max-w-sm w-full">
            <h1 class="text-xl font-bold">{t('auth.register.registration-disabled.title')}</h1>
            <p class="text-muted-foreground mt-1 mb-4">
              {t('auth.register.registration-disabled.description')}
            </p>

            <p class="text-muted-foreground mt-4">
              {t('auth.register.have-account')}{' '}
              <Button variant="link" as={A} class="inline px-0" href={getLoginPathWithRedirect()}>
                {t('auth.register.login')}
              </Button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  const [getShowEmailRegister, setShowEmailRegister] = createSignal(false);

  const registerWithProvider = async (provider: SsoProviderConfig) => {
    await authWithProvider({ provider, config, redirectPath: getRedirectPath() });
  };

  const getHasSsoProviders = () => getEnabledSsoProviderConfigs({ config }).length > 0;

  if (!config.auth.providers.email.isEnabled && !getHasSsoProviders()) {
    return (
      <AuthLayout>
        <NoAuthProviderWarning />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div class="flex items-center justify-center h-full p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">{t('auth.register.title')}</h1>
          <p class="text-muted-foreground mt-1 mb-4">{t('auth.register.description')}</p>

          <Show when={config.auth.providers.email.isEnabled}>
            {getShowEmailRegister() || !getHasSsoProviders() ? (
              <EmailRegisterForm />
            ) : (
              <Button onClick={() => setShowEmailRegister(true)} class="w-full">
                <div class="i-tabler-mail mr-2 size-4.5" />
                {t('auth.register.register-with-email')}
              </Button>
            )}
          </Show>

          <Show when={config.auth.providers.email.isEnabled && getHasSsoProviders()}>
            <Separator class="my-4" />
          </Show>

          <Show when={getHasSsoProviders()}>
            <div class="flex flex-col gap-2">
              <For each={getEnabledSsoProviderConfigs({ config })}>
                {(provider) => (
                  <SsoProviderButton
                    name={provider.name}
                    icon={provider.icon}
                    onClick={async () => registerWithProvider(provider)}
                    label={t('auth.register.register-with-provider', { provider: provider.name })}
                  />
                )}
              </For>
            </div>
          </Show>

          <p class="text-muted-foreground mt-4">
            {t('auth.register.have-account')}{' '}
            <Button variant="link" as={A} class="inline px-0" href={getLoginPathWithRedirect()}>
              {t('auth.register.login')}
            </Button>
          </p>

          <AuthLegalLinks />
        </div>
      </div>
    </AuthLayout>
  );
};
