import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { AboutContent } from '../components/about-content';

export const AboutPage: Component = () => {
  const { t } = useI18n();
  return (
    <div class="container mx-auto max-w-xl p-6 py-12">
      <Button as={A} href="/" class="gap-2 mb-8" variant="outline">
        <div class="i-tabler-arrow-left" />
        {t('common.back-to-home')}
      </Button>

      <AboutContent />
    </div>
  );
};
