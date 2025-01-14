import { createForm } from '@/modules/shared/form/form';
import { createVitrineUrl } from '@/modules/shared/utils/urls';
import { Button } from '@/modules/ui/components/button';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A } from '@solidjs/router';
import { type Component, For } from 'solid-js';
import * as v from 'valibot';
import { ssoProviders } from '../auth.constants';
import { signIn } from '../auth.services';
import { AuthLayout } from '../components/auth-layout.component';
import { SsoProviderButton } from '../components/sso-provider-button.component';

export const EmailLoginForm: Component = () => {
  const { form, Form, Field } = createForm({
    onSubmit: async ({ email, password }) => {
      const { error } = await signIn.email({ email, password });

      if (error) {
        throw error;
      }
    },
    schema: v.object({
      email: v.pipe(
        v.string(),
        v.trim(),
        v.nonEmpty('Please enter your email address'),
        v.email('This is not a valid email address'),
      ),
      password: v.pipe(
        v.string('Password is required'),
        v.nonEmpty('Please enter your password'),
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

      <Field name="password">
        {(field, inputProps) => (
          <TextFieldRoot class="flex flex-col gap-1 mb-4">
            <TextFieldLabel for="password">Password</TextFieldLabel>
            <TextField type="password" id="password" placeholder="Your password" {...inputProps} autoFocus value={field.value} aria-invalid={Boolean(field.error)} />
            {field.error && <div class="text-red-500 text-sm">{field.error}</div>}
          </TextFieldRoot>
        )}
      </Field>

      <Button type="submit" class="w-full">Login</Button>

      <div class="text-red-500 text-sm mt-4">{form.response.message}</div>

    </Form>
  );
};

export const LoginPage: Component = () => {
  const loginWithProvider = async (provider: typeof ssoProviders[number]) => {
    await signIn.social({ provider: provider.key });
  };

  return (
    <AuthLayout>
      <div class="flex items-center justify-center min-h-screen p-6 pb-18">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            Login to Papra
          </h1>
          <p class="text-muted-foreground mt-1 mb-4">
            Enter your email or use social login to access your Papra account.
          </p>

          {/* <EmailLoginForm />

          <Separator class="my-4" /> */}

          <For each={ssoProviders}>
            {provider => (
              <SsoProviderButton name={provider.name} icon={provider.icon} onClick={() => loginWithProvider(provider)} label={`Login with ${provider.name}`} />
            )}
          </For>

          <p class="text-muted-foreground mt-4">
            Don't have an account?
            {' '}
            <Button variant="link" as={A} class="inline px-0" href="/register">
              Register
            </Button>
          </p>

          <p class="text-muted-foreground mt-2">
            By continuing, you acknowledge that you understand and agree to the
            {' '}
            <Button variant="link" as={A} class="inline px-0" href={createVitrineUrl({ path: 'terms-of-service' })}>Terms of Service</Button>
            {' '}
            and
            {' '}
            <Button variant="link" as={A} class="inline px-0" href={createVitrineUrl({ path: 'privacy-policy' })}>Privacy Policy</Button>
            .
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
