import type { Component } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createVitrineUrl } from '@/modules/shared/utils/urls';
import { Button } from '@/modules/ui/components/button';
import { A } from '@solidjs/router';

export const AuthLegalLinks: Component = () => {
  const { config } = useConfig();
  const { te, t } = useI18n();

  if (!config.auth.showLegalLinksOnAuthPage) {
    return null;
  }

  return (
    <p class="text-muted-foreground mt-2">
      {te('auth.legal-links.description', {
        terms: (
          <Button variant="link" as={A} class="inline px-0" href={createVitrineUrl({ path: 'terms-of-service' })}>
            {t('auth.legal-links.terms')}
          </Button>
        ),
        privacy: (
          <Button variant="link" as={A} class="inline px-0" href={createVitrineUrl({ path: 'privacy' })}>
            {t('auth.legal-links.privacy')}
          </Button>
        ),
      })}
    </p>
  );
};
