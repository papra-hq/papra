import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';

export const CheckoutCancelPage: Component = () => {
  const { t } = useI18n();

  return (
    <div class="flex items-center justify-center min-h-screen p-6 bg-background">
      <div class="max-w-md w-full text-center">
        <div class="flex justify-center mb-6">
          <div class="p-4 bg-muted rounded-full">
            <div class="i-tabler-x size-16 text-muted-foreground" />
          </div>
        </div>

        <h1 class="text-3xl font-bold mb-3">
          {t('subscriptions.checkout-cancel.title')}
        </h1>

        <p class="text-muted-foreground mb-1">
          {t('subscriptions.checkout-cancel.description')}
        </p>

        <p class="text-muted-foreground mb-8">
          {t('subscriptions.checkout-cancel.no-charges')}
        </p>

        <div class="flex flex-col gap-3">
          <Button as={A} href="/" size="lg" class="w-full">
            {t('subscriptions.checkout-cancel.back-to-organizations')}
            <div class="i-tabler-arrow-left size-5 mr-2 order-first" />
          </Button>

          <p class="text-sm text-muted-foreground">
            {t('subscriptions.checkout-cancel.need-help')}
            {' '}
            <a href="https://papra.app/contact" class="underline hover:no-underline" target="_blank" rel="noreferrer">
              {t('subscriptions.checkout-cancel.contact-support')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
