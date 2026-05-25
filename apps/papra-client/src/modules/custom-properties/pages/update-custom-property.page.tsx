import type { Component } from 'solid-js';
import type { PropertyDefinitionDraft } from '../components/custom-property-definition-form.component';
import { useNavigate, useParams } from '@solidjs/router';
import { useMutation, useQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { queryClient } from '@/modules/shared/query/query-client';
import { Button } from '@/modules/ui/components/button';
import { createToast } from '@/modules/ui/components/sonner';
import { CustomPropertyDefinitionForm } from '../components/custom-property-definition-form.component';
import { fetchCustomPropertyDefinition, updateCustomPropertyDefinition } from '../custom-properties.services';

export const UpdateCustomPropertyPage: Component = () => {
  const params = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const query = useQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'custom-properties', params.propertyDefinitionId],
    queryFn: () => fetchCustomPropertyDefinition({ organizationId: params.organizationId, propertyDefinitionId: params.propertyDefinitionId }),
  }));

  const updateMutation = useMutation(() => ({
    mutationFn: async ({ propertyDefinition }: { propertyDefinition: PropertyDefinitionDraft }) => {
      // Cannot update the type
      const { type: _, ...definition } = propertyDefinition;

      await updateCustomPropertyDefinition({
        organizationId: params.organizationId,
        propertyDefinitionId: params.propertyDefinitionId,
        propertyDefinition: definition,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'custom-properties'] });

      createToast({
        message: t('custom-properties.update.success'),
        type: 'success',
      });
      navigate(`/organizations/${params.organizationId}/custom-properties`);
    },
    onError: () => {
      createToast({
        message: t('custom-properties.update.error'),
        type: 'error',
      });
    },
  }));

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold">
          {t('custom-properties.update.title')}
        </h1>
      </div>

      <Show when={query.data?.definition}>
        {getDefinition => (
          <CustomPropertyDefinitionForm
            organizationId={params.organizationId}
            propertyDefinition={getDefinition()}
            onSubmit={({ propertyDefinition }) => updateMutation.mutateAsync({ propertyDefinition })}
            submitButton={(
              <Button type="submit" isLoading={updateMutation.isPending}>
                {t('custom-properties.update.submit')}
              </Button>
            )}
          />
        )}
      </Show>
    </div>
  );
};
