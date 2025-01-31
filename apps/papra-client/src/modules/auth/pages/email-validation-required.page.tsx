import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { AuthLayout } from '../../ui/layouts/auth-layout.component';

export const EmailValidationRequiredPage: Component = () => {
  const { t } = useI18n();

  return (
    <AuthLayout>
      <div class="flex items-center justify-center h-full p-6 sm:pb-32">
        <div class="max-w-sm w-full">
          <div class="i-tabler-mail size-12 text-primary mb-2" />

          <h1 class="text-xl font-bold">
            {t('auth.email-validation-required.title')}
          </h1>
          <p class="text-muted-foreground mt-1 mb-4">
            {t('auth.email-validation-required.description')}
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
