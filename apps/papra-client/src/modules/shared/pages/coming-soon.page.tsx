import type { Component } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';

export const ComingSoonPage: Component = () => {
  const { t } = useI18n();

  return (
    <div class="flex flex-col items-center justify-center gap-2 pt-24">
      <div class="i-tabler-alarm text-primary size-12" />
      <div class="text-xl font-medium">{t('coming-soon.title')}</div>
      <div class="text-sm  text-muted-foreground">{t('coming-soon.description')}</div>
    </div>
  );
};
