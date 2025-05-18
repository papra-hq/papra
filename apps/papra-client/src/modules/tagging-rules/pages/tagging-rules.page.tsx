import type { Component } from 'solid-js';
import type { TaggingRule } from '../tagging-rules.types';
import { A, useParams } from '@solidjs/router';
import { createMutation, createQuery } from '@tanstack/solid-query';
import { For, Match, Show, Switch } from 'solid-js';
import { useConfig } from '@/modules/config/config.provider';
import { useI18n } from '@/modules/i18n/i18n.provider';
import { queryClient } from '@/modules/shared/query/query-client';
import { Alert } from '@/modules/ui/components/alert';
import { Button } from '@/modules/ui/components/button';
import { EmptyState } from '@/modules/ui/components/empty';
import { deleteTaggingRule, fetchTaggingRules } from '../tagging-rules.services';

const TaggingRuleCard: Component<{ taggingRule: TaggingRule }> = (props) => {
  const { t } = useI18n();

  const getConditionsLabel = () => {
    const count = props.taggingRule.conditions.length;

    if (count === 0) {
      return t('tagging-rules.list.card.no-conditions');
    }

    if (count === 1) {
      return t('tagging-rules.list.card.one-condition');
    }

    return t('tagging-rules.list.card.conditions', { count });
  };

  const deleteTaggingRuleMutation = createMutation(() => ({
    mutationFn: async () => {
      await deleteTaggingRule({ organizationId: props.taggingRule.organizationId, taggingRuleId: props.taggingRule.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', props.taggingRule.organizationId, 'tagging-rules'] });
    },
  }));

  return (
    <div class="flex items-center gap-2 bg-card py-4 px-6 rounded-md border">
      <A href={`/organizations/${props.taggingRule.organizationId}/tagging-rules/${props.taggingRule.id}`}>
        <div class="i-tabler-list-check size-8 opacity-30 mr-2" />
      </A>

      <div class="flex-1">
        <A href={`/organizations/${props.taggingRule.organizationId}/tagging-rules/${props.taggingRule.id}`} class="text-base font-bold">{props.taggingRule.name}</A>

        <p class="text-xs text-muted-foreground">
          {[getConditionsLabel(), props.taggingRule.description].filter(Boolean).join(' - ')}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <Button
          as={A}
          href={`/organizations/${props.taggingRule.organizationId}/tagging-rules/${props.taggingRule.id}`}
          variant="outline"
          size="icon"
          aria-label={t('tagging-rules.list.card.edit')}
        >
          <div class="i-tabler-edit size-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => deleteTaggingRuleMutation.mutate()}
          disabled={deleteTaggingRuleMutation.isPending}
          aria-label={t('tagging-rules.list.card.delete')}
        >
          <div class="i-tabler-trash size-4" />
        </Button>
      </div>

    </div>
  );
};

export const TaggingRulesPage: Component = () => {
  const { t } = useI18n();
  const { config } = useConfig();
  const params = useParams();

  const query = createQuery(() => ({
    queryKey: ['organizations', params.organizationId, 'tagging-rules'],
    queryFn: () => fetchTaggingRules({ organizationId: params.organizationId }),
  }));

  return (
    <div class="p-6 max-w-screen-lg mx-auto mt-4">
      <div class="border-b mb-6 pb-4 flex items-center justify-between gap-4 sm:flex-row flex-col">
        <div>
          <h1 class="text-xl font-bold">
            {t('tagging-rules.list.title')}
          </h1>

          <p class="text-muted-foreground mt-1">
            {t('tagging-rules.list.description')}
          </p>
        </div>

        <Show when={query.data?.taggingRules.length}>
          <Button as={A} href={`/organizations/${params.organizationId}/tagging-rules/create`} class="flex items-center gap-2 flex-shrink-0 sm:w-auto w-full">
            <div class="i-tabler-plus size-4" />
            {t('tagging-rules.list.no-tagging-rules.create-tagging-rule')}
          </Button>
        </Show>
      </div>

      <Show when={config.isDemoMode}>
        <Alert class="bg-primary text-primary-foreground mb-4">
          {t('tagging-rules.list.demo-warning')}
        </Alert>
      </Show>

      <Switch>
        <Match when={query.data?.taggingRules.length === 0}>
          <div class="mt-16">
            <EmptyState
              title={t('tagging-rules.list.no-tagging-rules.title')}
              description={t('tagging-rules.list.no-tagging-rules.description')}
              class="pt-0"
              icon="i-tabler-list-check"
              cta={(
                <Button as={A} href={`/organizations/${params.organizationId}/tagging-rules/create`}>
                  <div class="i-tabler-plus size-4 mr-2" />
                  {t('tagging-rules.list.no-tagging-rules.create-tagging-rule')}
                </Button>
              )}
            />
          </div>
        </Match>

        <Match when={query.data?.taggingRules.length}>
          <div class="flex flex-col gap-2">
            <For each={query.data?.taggingRules}>
              {taggingRule => <TaggingRuleCard taggingRule={taggingRule} />}
            </For>
          </div>
        </Match>

      </Switch>

    </div>
  );
};
