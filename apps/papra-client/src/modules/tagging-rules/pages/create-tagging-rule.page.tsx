import type { Component } from 'solid-js';
import type { TaggingRuleForCreation } from '../tagging-rules.types';
import { useNavigate, useParams } from '@solidjs/router';
import { createMutation } from '@tanstack/solid-query';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { createToast } from '@/modules/ui/components/sonner';
import { TaggingRuleForm } from '../components/tagging-rule-form.component';
import { createTaggingRule } from '../tagging-rules.services';

export const CreateTaggingRulePage: Component = () => {
  const { t } = useI18n();
  const params = useParams();
  const navigate = useNavigate();

  const createTaggingRuleMutation = createMutation(() => ({
    mutationFn: async ({ taggingRule }: { taggingRule: TaggingRuleForCreation }) => {
      await createTaggingRule({ taggingRule, organizationId: params.organizationId });
    },
    onSuccess: () => {
      createToast({
        message: t('tagging-rules.create.success'),
        type: 'success',
      });
      navigate(`/organizations/${params.organizationId}/tagging-rules`);
    },
    onError: () => {
      createToast({
        message: t('tagging-rules.create.error'),
        type: 'error',
      });
    },
  }));

  return (
    <div class="p-6 max-w-screen-md mx-auto mt-4">
      <div class="border-b mb-6 pb-4">
        <h1 class="text-xl font-bold">
          {t('tagging-rules.create.title')}
        </h1>
      </div>

      <TaggingRuleForm
        onSubmit={({ taggingRule }) => createTaggingRuleMutation.mutate({ taggingRule })}
        organizationId={params.organizationId}
        submitButtonText={t('tagging-rules.create.submit')}
      />
    </div>
  );
};
