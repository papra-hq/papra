import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { AuthCard } from '../components/auth-card.component';

export const EmailValidationRequiredPage: Component = () => {
  const { t } = useI18n();

  return (
    <AuthCard
      icon="i-tabler-mail"
      title={t('auth.email-validation-required.title')}
      description={t('auth.email-validation-required.description')}
    />
  );
};
