import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';

export const NoAuthProviderWarning: Component = () => {
  const { t } = useI18n();

  return (
    <div class="flex items-center justify-center h-full p-6 sm:pb-32">
      <div class="max-w-sm w-full">
        <h1 class="text-lg font-bold">{t('auth.no-auth-provider.title')}</h1>
        <p class="text-muted-foreground mt-1 mb-4">
          {t('auth.no-auth-provider.description')}
        </p>
      </div>
    </div>
  );
};
