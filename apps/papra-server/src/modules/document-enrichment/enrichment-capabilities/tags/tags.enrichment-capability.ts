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
        const { canCreateNewTags, maxTags } = organizationSettings.ai.autoTagging;

        return {
          fragment: [
            'DOCUMENT TAGS',
            '',
            '- Suggest tags that are relevant to the document content.',
            `- Select at most ${maxTags} tags.`,

            ...(canCreateNewTags
              ? [
                  '- You may suggest new tags that do not exist yet.',
                  '- If you suggest new tags, provide an optional description for each new tag.',
                  '- Do not suggest new tags that are too similar to existing tags.',
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
