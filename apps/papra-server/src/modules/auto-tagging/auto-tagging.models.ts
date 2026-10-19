import * as v from 'valibot';
import { uniq } from '../shared/utils';

function buildTagLine({ name, description }: { name: string; description?: string | null }) {
  return description ? `- ${name}: ${description}` : `- ${name}`;
}

export function buildAutoTaggingInstructions({
  existingTags,
  canCreateNewTags,
  maxTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  canCreateNewTags: boolean;
  maxTags: number;
}) {
  if (existingTags.length === 0) {
    return [
      `Create at most ${maxTags} concise tag${maxTags === 1 ? '' : 's'} with optional descriptions, or none if nothing fits.`,
    ];
  }

  return [
    `Pick at most ${maxTags} relevant tag${maxTags === 1 ? '' : 's'}, fewer is fine.`,
    canCreateNewTags
      ? 'Prefer these tags, and only propose new ones, with an optional description, when none fit:'
      : 'Only choose from these tags:',
    ...existingTags.map(buildTagLine),
  ];
}

export type AutoTaggingResponse = {
  existingTags?: string[];
  newTags?: { name: string; description?: string }[];
};

export function buildAutoTaggingSchemaEntries({
  existingTags,
  canCreateNewTags,
}: {
  existingTags: { name: string; description?: string | null }[];
  canCreateNewTags: boolean;
}): v.ObjectEntries {
  const hasExistingTags = existingTags.length > 0;
  const newTagsSchema = v.array(
    v.object({ name: v.string(), description: v.optional(v.string()) }),
  );

  if (canCreateNewTags && hasExistingTags) {
    return {
      existingTags: v.array(v.picklist(existingTags.map((tag) => tag.name))),
      newTags: newTagsSchema,
    };
  }

  if (canCreateNewTags && !hasExistingTags) {
    return { newTags: newTagsSchema };
  }

  return {
    existingTags: v.array(v.picklist(existingTags.map((tag) => tag.name))),
  };
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
