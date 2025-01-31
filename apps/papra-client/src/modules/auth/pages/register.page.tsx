import type { ssoProviders } from '../auth.constants';
import { useConfig } from '@/modules/config/config.provider';
import { createForm } from '@/modules/shared/form/form';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A, useNavigate } from '@solidjs/router';
import { type Component, createSignal, For, Show } from 'solid-js';
import * as v from 'valibot';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';
import { getEnabledSsoProviderConfigs } from '../auth.models';
import { signIn, signUp } from '../auth.services';
import { AuthLegalLinks } from '../components/legal-links.component';
import { SsoProviderButton } from '../components/sso-provider-button.component';

export const EmailRegisterForm: Component = () => {
  const { config } = useConfig();
  const navigate = useNavigate();

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
        v.nonEmpty('Please enter an email address'),
        v.email('This is not a valid email address'),
      ),
      password: v.pipe(
        v.string('Password is required'),
        v.nonEmpty('Please enter a password'),
        v.minLength(8, 'Password must be at least 8 characters'),
        v.maxLength(128, 'Password must be at most 128 characters'),
      ),
      name: v.pipe(
        v.string('Name is required'),
        v.nonEmpty('Please enter a name'),
        v.maxLength(64, 'Name must be at most 64 characters'),
      ),
    }),
  });

  return (
    <Form>
      <Field name="email">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="email">Email</TextFieldLabel>
            <TextField type="email" id="email" placeholder="Eg. ada@papra.app" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="name">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="name">Your full name</TextFieldLabel>
            <TextField type="text" id="name" placeholder="Eg. Ada Lovelace" {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="password">Password</TextFieldLabel>

            <TextField type="password" id="password" placeholder="Your password" {...inputProps} value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">Register</Button>

      <div class="text-red-500 text-sm mt-4">{form.response.message}</div>

    </Form>
  );
};

export const RegisterPage: Component = () => {
  const { config } = useConfig();

  if (!config.auth.isRegistrationEnabled) {
    return (
      <AuthLayout>
        <div class="flex items-center justify-center h-full p-6 sm:pb-32">
          <div class="max-w-sm w-full">
            <h1 class="text-xl font-bold">
              Registration is disabled
            </h1>
            <p class="text-muted-foreground mt-1 mb-4">
              The creation of new accounts is currently disabled on this instance of Papra. Only users with existing accounts can log in. If you think this is a mistake, please contact the administrator of this instance.
            </p>

            <p class="text-muted-foreground mt-4">
              Already have an account?
              {' '}
              <Button variant="link" as={A} class="inline px-0" href="/login">
                Login
              </Button>
            </p>

          </div>
        </div>
      </AuthLayout>
    );
  }

  const [getShowEmailRegister, setShowEmailRegister] = createSignal(false);

  const registerWithProvider = async (provider: typeof ssoProviders[number]) => {
    await signIn.social({ provider: provider.key });
  };

  const getHasSsoProviders = () => getEnabledSsoProviderConfigs({ config }).length > 0;

  return (
    <AuthLayout>
      <div class="flex items-center justify-center h-full p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            Register to Papra
          </h1>
          <p class="text-muted-foreground mt-1 mb-4">
            Enter your email or use social login to create your Papra account.
          </p>

          {getShowEmailRegister() || !getHasSsoProviders()
            ? <EmailRegisterForm />
            : (
                <Button onClick={() => setShowEmailRegister(true)} class="w-full">
                  <div class="i-tabler-mail mr-2 size-4.5" />
                  Register with email
                </Button>
              )}

          <Show when={getHasSsoProviders()}>
            <Separator class="my-4" />

            <div class="flex flex-col gap-2">
              <For each={getEnabledSsoProviderConfigs({ config })}>
                {provider => (
                  <SsoProviderButton name={provider.name} icon={provider.icon} onClick={() => registerWithProvider(provider)} label={`Register with ${provider.name}`} />
                )}
              </For>
            </div>
          </Show>

          <p class="text-muted-foreground mt-4">
            Already have an account?
            {' '}
            <Button variant="link" as={A} class="inline px-0" href="/login">
              Login
            </Button>
          </p>

          <AuthLegalLinks />
        </div>
      </div>
    </AuthLayout>
  );
};
