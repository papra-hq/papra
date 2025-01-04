import { createProtectedPage } from '@/modules/auth/middleware/protected-page.middleware';
import { useAsyncState } from '@/modules/shared/signals/async-state';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { onMount, Suspense } from 'solid-js';
import { match, P } from 'ts-pattern';
import { getCheckoutSessionStatus } from '../payments.services';

export const CheckoutSuccessPage = createProtectedPage({
  authType: 'private',
  component: () => {
    const [searchParams] = useSearchParams();
    const { execute, getStatus, onSuccess } = useAsyncState(getCheckoutSessionStatus);
    const navigate = useNavigate();

    onMount(() => {
      const sessionId = searchParams.sessionId;

      if (!sessionId || typeof sessionId !== 'string') {
        return console.error('No sessionId found in search params');
      }

      execute({ sessionId });
    });

    onSuccess(async () => {
      setTimeout(() => navigate('/'), 2000);
    });

    return (
      <div class="text-center">
        <Suspense>
          {match({ status: getStatus() })
            .with({ status: P.union('idle', 'loading') }, () => (
              <div class="flex items-center justify-center h-screen flex-col gap-2">
                <div class="i-tabler-loader-2 animate-spin text-4xl text-neutral-600" />
                <div class="text-lg font-semibold">Processing payment...</div>
              </div>
            ))
            .with({ status: 'error' }, () => (
              <div class="flex items-center justify-center h-screen flex-col gap-2">
                <div class="i-tabler-alert-triangle text-4xl text-red-500" />
                <div class="text-lg font-semibold">An error occurred, please try again later</div>
              </div>
            ))
            .with({ status: 'success' }, () => (
              <div class="flex items-center justify-center h-screen flex-col gap-2">
                <div class="i-tabler-check text-4xl text-green-500" />
                <div class="text-lg font-semibold">Payment successful</div>
                <p class="text-neutral-500">Redirecting to your dashboard...</p>
              </div>
            ))
            .exhaustive()}
        </Suspense>
      </div>
    );
  },
});
