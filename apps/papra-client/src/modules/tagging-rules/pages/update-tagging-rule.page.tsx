import type { Component } from 'solid-js';
import type { TaggingRuleForCreation } from '../tagging-rules.types';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { queryClient } from '@/modules/shared/query/query-client';
import { createToast } from '@/modules/ui/components/sonner';
import { useNavigate, useParams } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { Show } from 'solid-js';
import { TaggingRuleForm } from '../components/tagging-rule-form.component';
import { getTaggingRule, updateTaggingRule } from '../tagging-rules.services';

export const UpdateTaggingRulePage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'tagging-rules', params.taggingRuleId],
    queryFn: () => getTaggingRule({ organizationId: params.organizationId, taggingRuleId: params.taggingRuleId }),
  }));

  const updateTaggingRuleMutation = createMutation(() => ({
    mutationFn: async ({ taggingRule }: { taggingRule: TaggingRuleForCreation }) => {
      await updateTaggingRule({ organizationId: params.organizationId, taggingRuleId: params.taggingRuleId, taggingRule });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations', params.organizationId, 'tagging-rules'] });

      createToast({
        message: t('tagging-rules.create.success'),
        type: 'success',
      });
      navigate(`/organizations/${params.organizationId}/tagging-rules`);
    },
    onError: () => {
      createToast({
        message: t('tagging-rules.update.error'),
        type: 'error',
      });
    },
  }));

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold">
          {t('tagging-rules.update.title')}
        </h1>
      </div>

      <Show when={query.data?.taggingRule}>
        {getTaggingRule => (
          <TaggingRuleForm
            onSubmit={({ taggingRule }) => updateTaggingRuleMutation.mutate({ taggingRule })}
            organizationId={params.organizationId}
            taggingRule={getTaggingRule()}
            submitButtonText={t('tagging-rules.update.submit')}
          />
        )}
      </Show>

    </div>
  );
};
