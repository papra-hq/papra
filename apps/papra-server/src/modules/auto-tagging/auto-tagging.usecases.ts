import type { AiServices } from '../ai/ai.services';
import type { Tag } from '../tags/tags.types';
import type {
  applyTagsToDocuments as applyTagsToDocumentsUsecase,
  createTag as createTagUsecase,
} from '../tags/tags.usecases';
import pLimit from 'p-limit';
import type { AutoTaggingActions } from './auto-tagging.models';
import {
  buildAutoTaggingSchema,
  buildAutoTaggingSystemPrompt,
  buildAutoTaggingUserPrompt,
  getTagsActions,
} from './auto-tagging.models';

export function buildPromptForAutoTagging({ aiServices }: { aiServices: AiServices }) {
  return async ({
    document,
    existingTags,
    canCreateNewTags,
    maxTags,
    modelId,
  }: {
    document: { content: string; name: string; organizationId: string };
    existingTags: { id: string; name: string; description?: string | null }[];
    canCreateNewTags: boolean;
    maxTags: number;
    modelId: string;
  }): Promise<AutoTaggingActions> => {
    const autoTaggingResponse = await aiServices.generateStructuredData({
      modelId,
      organizationId: document.organizationId,
      source: 'auto-tagging',
      schema: buildAutoTaggingSchema({ existingTags, canCreateNewTags }),
      systemPrompt: buildAutoTaggingSystemPrompt({ existingTags, canCreateNewTags, maxTags }),
      userPrompt: buildAutoTaggingUserPrompt({ document }),
    });

    return getTagsActions({
      autoTaggingResponse,
      existingTags,
      maxTags,
    });
  };
}

export function buildApplyAutoTaggingActions({
  createTag,
  applyTagsToDocuments,
}: {
  createTag: (
    args: Pick<
      Parameters<typeof createTagUsecase>[0],
      'organizationId' | 'name' | 'description' | 'color'
    >,
  ) => ReturnType<typeof createTagUsecase>;
  applyTagsToDocuments: (
    args: Pick<
      Parameters<typeof applyTagsToDocumentsUsecase>[0],
      'documentIds' | 'addTagIds' | 'removeTagIds' | 'organizationId' | 'userId'
    >,
  ) => ReturnType<typeof applyTagsToDocumentsUsecase>;
}) {
  return async ({
    documentId,
    organizationId,
    tagIdsToAdd,
    tagsToCreate,
  }: AutoTaggingActions & { documentId: string; organizationId: string }) => {
    const limit = pLimit(5);

    // TODO: introduce a createTags method with a new checkIfOrganizationCanCreateNewTag
    const createdTagsResults = await Promise.allSettled(
      tagsToCreate.map(async ({ name, description }) =>
        limit(async () =>
          createTag({
            organizationId,
            color: '#CCCCCC',
            name,
            description,
          }),
        ),
      ),
    );

    const createdTags = createdTagsResults
      .filter(
        (result): result is PromiseFulfilledResult<{ tag: Tag }> => result.status === 'fulfilled',
      )
      .map((result) => result.value.tag);

    await applyTagsToDocuments({
      documentIds: [documentId],
      addTagIds: [...tagIdsToAdd, ...createdTags.map((tag) => tag.id)],
      removeTagIds: [],
      organizationId,
      userId: undefined,
    });
  };
}
