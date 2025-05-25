import type { Component } from 'solid-js';
import { A } from '@solidjs/router';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { Button } from '@/modules/ui/components/button';
import { CreateOrganizationForm } from '../components/create-organization-form.component';
import { useCreateOrganization } from '../organizations.composables';

export const CreateOrganizationPage: Component = () => {
  const { t } = useI18n();
  const { createOrganization } = useCreateOrganization();

  return (
    <div>
      <div class="max-w-md mx-auto pt-12 sm:pt-24 px-6">
        <Button as={A} href="/" class="mb-4" variant="outline">
          <div class="i-tabler-arrow-left mr-2"></div>
          {t('organizations.create.back')}
        </Button>

        <h1 class="text-xl font-bold">
          {t('organizations.create.title')}
        </h1>

        <p class="text-muted-foreground mb-6">
          {t('organizations.create.description')}
        </p>

        <CreateOrganizationForm onSubmit={createOrganization} />
      </div>
    </div>
  );
};
