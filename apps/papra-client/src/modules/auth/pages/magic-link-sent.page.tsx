import { Button } from '@/modules/ui/components/button';
import { A } from '@solidjs/router';
import { Show } from 'solid-js';
import { authStore } from '../auth.store';
import { getEmailProvider } from '../magic-link/magic-link.models';
import { createProtectedPage } from '../middleware/protected-page.middleware';

export const MagicLinkSentPage = createProtectedPage({
  authType: 'public-only',
  component: () => {
    const { getMagicLinkRequestEmail } = authStore;

    const getProvider = () => {
      const { provider } = getEmailProvider({ email: getMagicLinkRequestEmail() });

      if (!provider) {
        return undefined;
      }

      return provider;
    };

    return (
      <div class="flex items-center justify-center min-h-screen">
        <div class="max-w-sm w-full">
          <div class="flex flex-col items-start py-8">
            <div class="i-tabler-mail-check text-7xl text-primary" />
            <h2 class="text-2xl font-semibold my-3">Magic link sent</h2>
            <p class="text-muted-foreground">
              We've sent you a magic link to
              {' '}
              <span class="text-primary">{getMagicLinkRequestEmail() ?? 'your email'}</span>
              .
            </p>
            <p class="text-muted-foreground">Click on the link in the email to login.</p>

            <div class="w-full flex gap-2 mt-6">
              <Show when={getProvider()}>
                {providerUrl => (
                  <Button as="a" href={providerUrl().url} target="_blank" rel="noopener noreferrer">
                    Open
                    {' '}
                    {providerUrl().name}
                    <span class="i-tabler-external-link ml-2 text-lg" />
                  </Button>
                )}
              </Show>

              <Button as={A} href="/login" variant="secondary" class="flex items-center justify-center">
                Go back to login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
