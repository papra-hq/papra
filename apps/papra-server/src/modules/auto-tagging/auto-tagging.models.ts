import * as v from 'valibot';
import { uniq } from '../shared/utils';

function buildTagLine({ name, description }: { name: string; description?: string | null }) {
  return description ? `- ${name}: ${description}` : `- ${name}`;
}

export function buildAutoTaggingSystemPrompt({
  existingTags,
  canCreateNewTags,
  maxTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  canCreateNewTags: boolean;
  maxTags: number;
}) {
  if (existingTags.length > 0) {
    return [
      'You are an assistant that categorizes documents by selecting the most relevant tags based on their content.',
      '',

      'Available tags:',
      ...existingTags.map(buildTagLine),
      '',
      'Instructions:',
      `- Select at most ${maxTags} tag${maxTags === 1 ? '' : 's'}, only those genuinely relevant to the document. Returning fewer is better than forcing irrelevant tags.`,
      '- Prefer the existing tags listed above whenever one fits.',
      canCreateNewTags
        ? '- If none of the existing tags fit well, you may propose new, concise tag names. You may provide an optional description for each new tag.'
        : '- Only choose from the existing tags listed above. Do not invent new tags.',
    ].join('\n');
  }

  // No existing tags, and we are sure that new tags can be created, so we make the prompt all about creating new tags.
  return [
    'You are an assistant that categorizes documents by creating the most relevant tags based on their content.',
    '',
    'Instructions:',
    `- Create at most ${maxTags} tag${maxTags === 1 ? '' : 's'}, only those genuinely relevant to the document. Returning fewer is better than forcing irrelevant tags.`,
    '- If you cannot think of any relevant tags, return an empty list.',
    '- The tags should be concise and useful for categorizing documents.',
    '- You may provide an optional description for each tag.',
  ].join('\n');
}

export function buildAutoTaggingUserPrompt({
  document,
}: {
  document: { content: string; name: string };
}) {
  return [`Document name: ${document.name}`, 'Document content:', document.content].join('\n');
}

export type AutoTaggingResponse = {
  existingTags?: string[];
  newTags?: { name: string; description?: string }[];
};

export function buildAutoTaggingSchema({
  existingTags,
  canCreateNewTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  canCreateNewTags: boolean;
}): v.GenericSchema<AutoTaggingResponse> {
  const hasExistingTags = existingTags.length > 0;

  if (canCreateNewTags && hasExistingTags) {
    return v.object({
      existingTags: v.array(v.picklist(existingTags.map((tag) => tag.name))),
      newTags: v.array(v.object({ name: v.string(), description: v.optional(v.string()) })),
    });
  }

  if (canCreateNewTags && !hasExistingTags) {
    return v.object({
      newTags: v.array(v.object({ name: v.string(), description: v.optional(v.string()) })),
    });
  }

  return v.object({
    existingTags: v.array(v.picklist(existingTags.map((tag) => tag.name))),
  });
}

export function getTagsActions({
  autoTaggingResponse,
  existingTags,
  maxTags,
}: {
  autoTaggingResponse: AutoTaggingResponse;
  existingTags: { name: string; id: string }[];
  maxTags: number;
}): {
  tagIdsToAdd: string[];
  tagsToCreate: { name: string; description?: string }[];
} {
  const { existingTags: requestedExistingTagNames = [], newTags = [] } = autoTaggingResponse;

  const existingTagNamesMap = new Map(existingTags.map((tag) => [tag.name, tag.id]));

  const tagIdsToAdd = uniq(
    requestedExistingTagNames.map((tagName) => existingTagNamesMap.get(tagName)).filter(Boolean),
  ).slice(0, maxTags);

  const tagsToCreate = newTags.slice(0, maxTags - tagIdsToAdd.length);

  return { tagIdsToAdd, tagsToCreate };
}
