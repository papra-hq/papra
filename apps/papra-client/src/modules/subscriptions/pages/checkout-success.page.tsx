import type { Component } from 'solid-js';
import { A, useNavigate, useSearchParams } from '@solidjs/router';
import { createEffect, createSignal, Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';

export const CheckoutSuccessPage: Component = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = createSignal(5);

  createEffect(() => {
    const sessionId = searchParams.sessionId;

    // If no session ID, redirect immediately
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Start countdown
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  });

  return (
    <div class="flex items-center justify-center min-h-screen p-6 bg-background">
      <div class="max-w-md w-full text-center">
        <div class="flex justify-center mb-6">
          <div class="p-4 bg-primary/10 rounded-full">
            <div class="i-tabler-check size-16 text-primary" />
          </div>
        </div>

        <h1 class="text-3xl font-bold mb-3">
          {t('subscriptions.checkout-success.title')}
        </h1>

        <p class="text-muted-foreground mb-1">
          {t('subscriptions.checkout-success.description')}
        </p>

        <p class="text-muted-foreground mb-8">
          {t('subscriptions.checkout-success.thank-you')}
        </p>

        <div class="flex flex-col gap-3">
          <Button as={A} href="/" size="lg" class="w-full">
            {t('subscriptions.checkout-success.go-to-organizations')}
            <div class="i-tabler-arrow-right size-5 ml-2" />
          </Button>

          <Show when={countdown() > 0}>
            <p class="text-sm text-muted-foreground">
              {t('subscriptions.checkout-success.redirecting', {
                count: countdown(),
                plural: countdown() !== 1 ? 's' : '',
              })}
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
};
