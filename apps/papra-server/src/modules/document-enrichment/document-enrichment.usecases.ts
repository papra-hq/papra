import type { Logger } from '@crowlog/logger';
import { ensureModelId } from '../ai/ai.models';
import type {
  buildApplyAutoTaggingActions,
  buildPromptForAutoTagging,
} from '../auto-tagging/auto-tagging.usecases';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createLogger } from '../shared/logger/logger';
import type { TagsRepository } from '../tags/tags.repository';

export function buildEnrichDocument({
  promptForAutoTagging,
  applyAutoTaggingActions,
  documentsRepository,
  tagsRepository,
  resolveOrganizationSettings,
  logger = createLogger({ namespace: 'documentEnrichment' }),
}: {
  promptForAutoTagging: ReturnType<typeof buildPromptForAutoTagging>;
  applyAutoTaggingActions: ReturnType<typeof buildApplyAutoTaggingActions>;
  documentsRepository: Pick<DocumentsRepository, 'getDocumentById'>;
  tagsRepository: Pick<TagsRepository, 'getOrganizationTags'>;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  logger?: Logger;
}) {
  return async ({ documentId, organizationId }: { documentId: string; organizationId: string }) => {
    const [{ document }, { tags: existingTags }, { organizationSettings }] = await Promise.all([
      documentsRepository.getDocumentById({ documentId, organizationId }),
      tagsRepository.getOrganizationTags({ organizationId }),
      resolveOrganizationSettings({ organizationId }),
    ]);

    const orgHasNoExistingTags = existingTags.length === 0;
    const {
      canCreateNewTags,
      maxTags,
      isEnabled: isAutoTaggingEnabled,
    } = organizationSettings.ai.autoTagging;

    if (orgHasNoExistingTags && !canCreateNewTags) {
      logger.info(
        { documentId, organizationId },
        'No tags available and cannot create new tags. Skipping auto-tagging.',
      );
      return;
    }

    if (!isAutoTaggingEnabled) {
      logger.info(
        { documentId, organizationId },
        'Auto-tagging is disabled in organization settings. Skipping auto-tagging.',
      );
      return;
    }

    if (!document) {
      throw createDocumentNotFoundError();
    }

    const startedAt = Date.now();
    const actions = await promptForAutoTagging({
      document,
      existingTags,
      canCreateNewTags,
      maxTags,
      modelId: ensureModelId(organizationSettings.ai.autoTagging.modelId),
    });
    const durationMs = Date.now() - startedAt;
    logger.info({ documentId, organizationId, durationMs }, 'Auto-tagging completed');

    await applyAutoTaggingActions({ documentId, organizationId, ...actions });
  };
}
