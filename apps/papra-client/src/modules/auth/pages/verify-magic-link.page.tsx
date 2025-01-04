import { useAsyncState } from '@/modules/shared/signals/async-state';
import { Button } from '@/modules/ui/components/button';
import { A, useNavigate, useParams } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { verifyMagicLink } from '../auth.services';
import { authStore } from '../auth.store';
import { createProtectedPage } from '../middleware/protected-page.middleware';

export const PendingMagicLinkPage = createProtectedPage({
  authType: 'public-only',
  component: () => {
    const params = useParams();
    const navigate = useNavigate();

    const [getHasError, setHasError] = createSignal(false);

    const { execute, onSuccess, onError } = useAsyncState(verifyMagicLink);

    execute({ token: params.token });

    onSuccess(async ({ data: { accessToken } }) => {
      await authStore.setAccessToken({ accessToken });

      navigate('/', { replace: true });
    });

    onError(() => {
      setHasError(true);
    });

    return (
      <div class="flex items-center justify-center h-screen flex-col gap-4">
        {getHasError()
          ? (
              <>
                <div class="i-tabler-alert-triangle text-4xl text-red-500" />
                <div class="text-lg font-semibold">Invalid or expired magic link</div>

                <div>
                  <Button as={A} href="/login" variant="secondary" class="block w-full flex items-center justify-center">
                    Go back to login
                    <span class="i-tabler-arrow-right ml-2 text-lg " />
                  </Button>
                </div>
              </>
            )
          : (
              <>
                <div class="i-tabler-loader-2 animate-spin text-4xl text-muted-foreground"></div>
                <div class="text-lg font-semibold">Authenticating...</div>
              </>
            )}
      </div>
    );
  },
});
