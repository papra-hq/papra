import type { Component, ParentComponent } from 'solid-js';
import { config } from '@/modules/config/config';
import { createForm } from '@/modules/shared/form/form-legacy';
import { isHttpErrorWithStatusCode } from '@/modules/shared/http/http-errors';
import { useAsyncState } from '@/modules/shared/signals/async-state';
import { cn } from '@/modules/shared/style/cn';
import { createVitrineUrl } from '@/modules/shared/utils/urls';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { createToast } from '@/modules/ui/components/sonner';
import { TextField, TextFieldLabel, TextFieldRoot } from '@/modules/ui/components/textfield';
import { A, useNavigate } from '@solidjs/router';
import { createSignal, For, Show } from 'solid-js';
import { z } from 'zod';
import { requestMagicLink } from '../auth.services';
import { authStore } from '../auth.store';

const InlineLink: ParentComponent<{ href: string }> = props => (
  <Button variant="link" as={A} href={props.href} class="inline px-0">
    {props.children}
  </Button>
);

const SsoProviderButton: Component<{ name: string; icon: string; url: string; label: string }> = (props) => {
  const [getIsLoading, setIsLoading] = createSignal(false);

  const navigateToProvider = () => {
    setIsLoading(true);
    window.location.href = props.url;
  };

  return (
    <Button variant="secondary" class="block w-full flex items-center justify-center" onClick={navigateToProvider} disabled={getIsLoading()}>
      <span class={cn(`mr-2 text-lg inline-block`, getIsLoading() ? 'i-tabler-loader-2 animate-spin' : props.icon)} />
      {props.label}
    </Button>
  );
};

export const MagicLinkLinkForm: Component = () => {
  const navigate = useNavigate();

  const { getInputBindings, submit, onSubmit, getFieldError, getForm } = createForm({
    fields: {
      email: {
        schema: z.string().trim().email('Please enter a valid email address'),
      },
    },
  });

  const { execute: requestLink, getIsLoading, onSuccess, onError } = useAsyncState(requestMagicLink);

  onSubmit(async ({ email }) => {
    await requestLink({ email });
  });

  onSuccess(() => {
    authStore.setMagicLinkRequestEmail(getForm().email);
    navigate('/magic-link');
  });

  onError(({ error }) => {
    if (isHttpErrorWithStatusCode({ error, statusCode: 429 })) {
      createToast({ type: 'error', message: 'Too many magic link requests. Please try again later.' });
      return;
    }

    createToast({ type: 'error', message: 'An error occurred while requesting the magic link. Please try again later.' });
  });

  return (
    <div class="flex flex-col gap-3 w-full">
      <TextFieldRoot class="flex flex-col gap-2">
        <TextFieldLabel for="email">Email address</TextFieldLabel>
        <TextField type="email" id="email" placeholder="Eg. jane.doe@example.com" {...getInputBindings('email')} />
        <Show when={getFieldError('email')}>{getErrorMessage => <div class="text-red-500 text-sm">{getErrorMessage()}</div>}</Show>
      </TextFieldRoot>

      <Button onClick={submit} isLoading={getIsLoading()}>
        Continue with email

        <span class="i-tabler-arrow-right ml-2" />
      </Button>
    </div>
  );
};

export const GenericAuthPage: Component<{ type: 'login' | 'register' }> = (props) => {
  const { baseApiUrl } = config;

  const ssoProviders = [
    // {
    //   name: 'Google',
    //   icon: 'i-tabler-brand-google-filled',
    //   url: new URL('/api/auth/google', baseApiUrl).toString(),
    //   labels: {
    //     login: 'Login with Google',
    //     register: 'Register with Google',
    //   },
    // },
    {
      name: 'GitHub',
      icon: 'i-tabler-brand-github',
      url: new URL('/api/auth/github', baseApiUrl).toString(),
      labels: {
        login: 'Login with GitHub',
        register: 'Register with GitHub',
      },
    },
  ];

  const byType = <L, R>({ login, register }: { login: L; register: R }): L | R => (props.type === 'login' ? login : register);

  if (!config.isRegistrationEnabled && props.type === 'register') {
    return (
      <div class="flex items-center justify-center min-h-screen p-6">
        <div class="max-w-sm w-full">
          <h1 class="text-xl font-bold">
            Registration is disabled
          </h1>
          <p class="text-muted-foreground mt-1 mb-2">
            Registration is disabled on this instance. Please contact your administrator for more information.
          </p>
          <p class="text-muted-foreground">
            Already have an account?
            {' '}
            <InlineLink href="/login">Login</InlineLink>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="flex items-center justify-center min-h-screen p-6">
      <div class="max-w-sm w-full">
        <h1 class="text-xl font-bold">
          {byType({
            login: 'Login to Papra',
            register: 'Register to Papra',
          })}
        </h1>
        <p class="text-muted-foreground mt-1 mb-6">
          {byType({
            login: 'Enter your email or use social login to access your Papra account.',
            register: 'Enter your email or use social login to create your Papra account.',
          })}
        </p>

        <div class=" w-full flex flex-col gap-2">
          <For each={ssoProviders}>
            {provider => (
              <SsoProviderButton label={byType(provider.labels)} {...provider} />
            )}
          </For>
        </div>

        <Separator class="my-6" />

        {/* <MagicLinkLinkForm /> */}

        {/* <Separator class="my-6" /> */}

        <p class="text-muted-foreground">
          {byType({
            login: 'Don\'t have an account?',
            register: 'Already have an account?',
          })}
          {' '}
          <InlineLink href={byType({ login: '/register', register: '/login' })}>
            {byType({ login: 'Register', register: 'Login' })}
          </InlineLink>
        </p>

        <p class="text-muted-foreground mt-2">
          By continuing, you acknowledge that you understand and agree to the
          {' '}
          <InlineLink href={createVitrineUrl({ path: 'terms-of-service' })}>Terms of Service</InlineLink>
          {' '}
          and
          {' '}
          <InlineLink href={createVitrineUrl({ path: 'privacy-policy' })}>Privacy Policy</InlineLink>
          .
        </p>
      </div>
    </div>
  );
};
