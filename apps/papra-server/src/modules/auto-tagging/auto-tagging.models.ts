import { uniq } from '../shared/utils';

export type AutoTaggingResponse = {
  existingTags?: string[];
  newTags?: { name: string; description?: string }[];
};

export type AutoTaggingActions = {
  tagIdsToAdd: string[];
  tagsToCreate: { name: string; description?: string }[];
};

export function getTagsActions({
  autoTaggingResponse,
  existingTags,
  maxTags,
}: {
  autoTaggingResponse: AutoTaggingResponse;
  existingTags: { name: string; id: string }[];
  maxTags: number;
}): AutoTaggingActions {
  const { existingTags: requestedExistingTagNames = [], newTags = [] } = autoTaggingResponse;

  const existingTagNamesMap = new Map(existingTags.map((tag) => [tag.name, tag.id]));

  const tagIdsToAdd = uniq(
    requestedExistingTagNames.map((tagName) => existingTagNamesMap.get(tagName)).filter(Boolean),
  ).slice(0, maxTags);

  const tagsToCreate = newTags.slice(0, maxTags - tagIdsToAdd.length);

  return { tagIdsToAdd, tagsToCreate };
}
