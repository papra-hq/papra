import {
  DEFAULT_TAGGING_PROMPT,
  DEFAULT_TAGGING_RELEVANCE_INSTRUCTION,
  DEFAULT_TAGGING_DUPLICATES_INSTRUCTION,
} from './tags.models';
import * as v from 'valibot';
import { defineDocumentEnrichmentCapabilityFactory } from '../enrichment-capabilities-definition';
import type { buildApplyAutoTaggingActions } from '../../../auto-tagging/auto-tagging.usecases';
import type { Config } from '../../../config/config.types';
import { getTagsActions } from '../../../auto-tagging/auto-tagging.models';

export const buildTagsEnrichmentCapability = defineDocumentEnrichmentCapabilityFactory(
  ({
    config,
    applyAutoTaggingActions,
  }: {
    config: Config;
    applyAutoTaggingActions: ReturnType<typeof buildApplyAutoTaggingActions>;
  }) => {
    return {
      name: 'auto-tagging',

      documentInfoRequirements: ['tags'],

      isAvailable: ({ organizationSettings, tags }) =>
        config.ai.isEnabled &&
        config.autoTagging.isEnabled &&
        organizationSettings.ai.autoTagging.isEnabled &&
        (organizationSettings.ai.autoTagging.canCreateNewTags || tags.length > 0),

      buildSystemPromptFragments: ({ organizationSettings }) => {
        const { canCreateNewTags, maxTags, taggingPrompt } = organizationSettings.ai.autoTagging;
        const customPrompt = taggingPrompt?.trim();
        const useDefault = !customPrompt || customPrompt === DEFAULT_TAGGING_PROMPT;
        // Preserve the original wording, ordering and conditional guidance for defaults.

        return {
          fragment: [
            'DOCUMENT TAGS',
            '',
            useDefault ? DEFAULT_TAGGING_RELEVANCE_INSTRUCTION : customPrompt,
            `- Select at most ${maxTags} tags.`,

            ...(canCreateNewTags
              ? [
                  '- You may suggest new tags that do not exist yet.',
                  '- If you suggest new tags, provide an optional description for each new tag.',
                  ...(useDefault ? [DEFAULT_TAGGING_DUPLICATES_INSTRUCTION] : []),
                ]
              : [
                  '- You may only suggest existing tags.',
                  '- If no relevant tags can be found, return an empty list.',
                ]),
          ].join('\n'),
        };
      },

      getResponseSchema: ({ organizationSettings, tags }) => {
        const hasExistingTags = tags.length > 0;
        const { canCreateNewTags } = organizationSettings.ai.autoTagging;

        if (canCreateNewTags && hasExistingTags) {
          return v.object({
            existingTags: v.array(v.picklist(tags.map((tag) => tag.name))),
            newTags: v.array(v.object({ name: v.string(), description: v.optional(v.string()) })),
          });
        }

        if (canCreateNewTags && !hasExistingTags) {
          return v.object({
            newTags: v.array(v.object({ name: v.string(), description: v.optional(v.string()) })),
          });
        }

        return v.object({
          existingTags: v.array(v.picklist(tags.map((tag) => tag.name))),
        });
      },

      apply: async ({ response, documentId, organizationId, tags, organizationSettings }) => {
        const actions = getTagsActions({
          autoTaggingResponse: response,
          existingTags: tags,
          maxTags: organizationSettings.ai.autoTagging.maxTags,
        });

        await applyAutoTaggingActions({
          documentId,
          organizationId,
          ...actions,
        });
      },
    };
  },
);
