import type { Component } from 'solid-js';
import { A, useLocation } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';

export const NotFoundPage: Component = () => {
  const { t } = useI18n();
  const location = useLocation();

  const getRedirectionUrl = () => {
    if (location.pathname.startsWith('/admin/') || location.pathname === '/admin') {
      return '/admin';
    }

    return '/';
  };

  return (
    <div class="h-screen flex flex-col items-center justify-center p-6">

      <div class="flex items-center flex-row sm:gap-24">
        <div class="max-w-350px">
          <h1 class="text-xl mr-4 py-2">{t('not-found.title')}</h1>
          <p class="text-muted-foreground">
            {t('not-found.description')}
          </p>
          <Button as={A} href={getRedirectionUrl()} class="mt-4" variant="default">
            <div class="i-tabler-arrow-left mr-2" />
            {t('common.back-to-home')}
          </Button>
        </div>

        <div class="hidden sm:block light:text-muted-foreground">
          <div class="i-tabler-file-shredder text-200px" />
        </div>
      </div>
    </div>
  );
};
