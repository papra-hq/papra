import type { AiServices } from '../ai/ai.services';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { Logger } from '@crowlog/logger';
import type { Config } from '../config/config.types';
import type { EventServices } from '../app/events/events.services';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { updateDocument } from '../documents/documents.usecases';
import { createLogger } from '../shared/logger/logger';
import { ensureModelId } from '../ai/ai.models';
import {
  buildAutoNamingSchema,
  buildAutoNamingSystemPrompt,
  buildAutoNamingUserPrompt,
  getTitleAction,
} from './auto-naming.models';

export async function promptForAutoNaming({
  aiServices,
  document,
  modelId,
  maxTitleLength,
}: {
  aiServices: AiServices;
  document: { content: string; name: string; organizationId: string };
  modelId: string;
  maxTitleLength: number;
}) {
  const autoNamingResponse = await aiServices.generateStructuredData({
    modelId,
    organizationId: document.organizationId,
    source: 'auto-naming',
    schema: buildAutoNamingSchema(),
    systemPrompt: buildAutoNamingSystemPrompt({ maxTitleLength }),
    userPrompt: buildAutoNamingUserPrompt({ document }),
  });

  return getTitleAction({
    autoNamingResponse,
    currentName: document.name,
    maxTitleLength,
  });
}

export async function autoNameDocument({
  aiServices,
  documentId,
  organizationId,
  documentsRepository,
  resolveOrganizationSettings,
  eventServices,
  config,
  logger = createLogger({ namespace: 'autoNameDocument' }),
}: {
  aiServices: AiServices;
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  eventServices: EventServices;
  config: Config;
  logger?: Logger;
}) {
  const [{ document }, { organizationSettings }] = await Promise.all([
    documentsRepository.getDocumentById({ documentId, organizationId }),
    resolveOrganizationSettings({ organizationId }),
  ]);

  const { isEnabled: isAutoNamingEnabled } = organizationSettings.ai.autoNaming;

  if (!isAutoNamingEnabled) {
    logger.info(
      { documentId, organizationId },
      'Auto-naming is disabled in organization settings. Skipping auto-naming.',
    );
    return;
  }

  if (!document) {
    throw createDocumentNotFoundError();
  }

  if (document.isDeleted) {
    logger.info({ documentId, organizationId }, 'Document is deleted. Skipping auto-naming.');
    return;
  }

  const startedAt = Date.now();
  const { shouldRename, title } = await promptForAutoNaming({
    aiServices,
    document,
    modelId: ensureModelId(organizationSettings.ai.autoNaming.modelId),
    maxTitleLength: config.autoNaming.maxTitleLength,
  });
  const durationMs = Date.now() - startedAt;
  logger.info({ documentId, organizationId, durationMs }, 'Auto-naming completed');

  if (!shouldRename) {
    logger.info({ documentId, organizationId }, 'Generated title matches current document name.');
    return;
  }

  await updateDocument({
    documentId,
    organizationId,
    documentsRepository,
    eventServices,
    changes: { name: title },
  });
}
