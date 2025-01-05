import type { Component, ParentComponent } from 'solid-js';
import { config } from '@/modules/config/config';
import { cn } from '@/modules/shared/style/cn';
import { createVitrineUrl } from '@/modules/shared/utils/urls';
import { Button } from '@/modules/ui/components/button';
import { Separator } from '@/modules/ui/components/separator';
import { A } from '@solidjs/router';
import { createSignal, For } from 'solid-js';

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
