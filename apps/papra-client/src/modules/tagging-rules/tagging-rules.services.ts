import type { AsDto } from '../shared/http/http-client.types';
import type { TaggingRule, TaggingRuleForCreation } from './tagging-rules.types';
import { apiClient } from '../shared/http/api-client';
import { coerceDates } from '../shared/http/http-client.models';

export async function fetchTaggingRules({ organizationId }: { organizationId: string }) {
  const { taggingRules } = await apiClient<{ taggingRules: AsDto<TaggingRule>[] }>({
    path: `/api/organizations/${organizationId}/tagging-rules`,
    method: 'GET',
  });

  return { taggingRules: taggingRules.map(coerceDates) };
}

export async function createTaggingRule({ taggingRule, organizationId }: { taggingRule: TaggingRuleForCreation; organizationId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/tagging-rules`,
    method: 'POST',
    body: taggingRule,
  });
}

export async function deleteTaggingRule({ organizationId, taggingRuleId }: { organizationId: string; taggingRuleId: string }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/tagging-rules/${taggingRuleId}`,
    method: 'DELETE',
  });
}

export async function getTaggingRule({ organizationId, taggingRuleId }: { organizationId: string; taggingRuleId: string }) {
  const { taggingRule } = await apiClient<{ taggingRule: AsDto<TaggingRule> }>({
    path: `/api/organizations/${organizationId}/tagging-rules/${taggingRuleId}`,
    method: 'GET',
  });

  return { taggingRule: coerceDates(taggingRule) };
}

export async function updateTaggingRule({ organizationId, taggingRuleId, taggingRule }: { organizationId: string; taggingRuleId: string; taggingRule: TaggingRuleForCreation }) {
  await apiClient({
    path: `/api/organizations/${organizationId}/tagging-rules/${taggingRuleId}`,
    method: 'PUT',
    body: taggingRule,
  });
}
