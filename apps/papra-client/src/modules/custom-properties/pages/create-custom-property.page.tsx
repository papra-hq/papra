import type { Component } from 'solid-js';
import type { PropertyDefinitionDraft } from '../components/custom-property-definition-form.component';
import { useNavigate, useParams } from '@solidjs/router';
import { useMutation } from '@tanstack/solid-query';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { CustomPropertyDefinitionForm } from '../components/custom-property-definition-form.component';
import { createCustomPropertyDefinition } from '../custom-properties.services';

export const CreateCustomPropertyPage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const createMutation = useMutation(() => ({
    mutationFn: async ({ propertyDefinition }: { propertyDefinition: PropertyDefinitionDraft }) => {
      await createCustomPropertyDefinition({ organizationId: params.organizationId, propertyDefinition });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'custom-properties'] });

      createToast({
        message: t('custom-properties.create.success'),
        type: 'success',
      });
      navigate(`/organizations/${params.organizationId}/custom-properties`);
    },
    onError: () => {
      createToast({
        message: t('custom-properties.create.error'),
        type: 'error',
      });
    },
  }));

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold">
          {t('custom-properties.create.title')}
        </h1>
      </div>

      <CustomPropertyDefinitionForm
        organizationId={params.organizationId}
        onSubmit={({ propertyDefinition }) => createMutation.mutateAsync({ propertyDefinition })}
        submitButton={(
          <Button type="submit" isLoading={createMutation.isPending}>
            {t('custom-properties.create.submit')}
          </Button>
        )}
      />
    </div>
  );
};
