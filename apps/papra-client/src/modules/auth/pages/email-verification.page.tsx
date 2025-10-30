import type { Component } from 'solid-js';
import { A, useSearchParams } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';

export const EmailVerificationPage: Component = () => {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  const getHasError = () => Boolean(searchParams.error);

  return (
    <AuthLayout>
      <div class="flex items-center justify-center h-full p-6 sm:pb-32">
        <div class="max-w-xs w-full flex flex-col items-center text-center">
          {getHasError()
            ? (
                <>
                  <div class="i-tabler-alert-circle size-12 text-destructive mb-2" />

                  <h1 class="text-xl font-bold">
                    {t('auth.email-verification.error.title')}
                  </h1>
                  <p class="text-muted-foreground mt-1 mb-4">
                    {t('auth.email-verification.error.description')}
                  </p>

                  <Button as={A} href="/login" class="gap-2" variant="secondary">
                    <div class="i-tabler-arrow-left size-4" />
                    {t('auth.email-verification.error.back')}
                  </Button>
                </>
              )
            : (
                <>
                  <div class="i-tabler-circle-check size-12 text-primary mb-2" />

                  <h1 class="text-xl font-bold">
                    {t('auth.email-verification.success.title')}
                  </h1>
                  <p class="text-muted-foreground mt-1 mb-4">
                    {t('auth.email-verification.success.description')}
                  </p>

                  <Button as={A} href="/login" class="gap-2">
                    {t('auth.email-verification.success.login')}
                    <div class="i-tabler-arrow-right size-4" />
                  </Button>
                </>
              )}
        </div>
      </div>
    </AuthLayout>
  );
};
