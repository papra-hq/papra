import type { Logger } from '@crowlog/logger';
import type { AiServices } from '../ai/ai.services';
import type { CustomPropertiesRepository } from '../custom-properties/custom-properties.repository';
import type { CustomPropertiesOptionsRepository } from '../custom-properties/options/custom-properties-options.repository';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { EventServices } from '../app/events/events.services';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { ResolveOrganizationSettingsUsecase } from '../organizations/organization-settings/organization-settings.usecases';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { updateDocument } from '../documents/documents.usecases';
import { setDocumentCustomPropertyValue } from '../custom-properties/custom-properties.usecases';
import { createLogger } from '../shared/logger/logger';
import { ensureModelId } from '../ai/ai.models';
import { isNonEmptyString } from '../shared/utils';
import {
  buildAiExtractionSchema,
  buildAiExtractionSystemPrompt,
  buildAiExtractionUserPrompt,
  getExtractableCustomProperties,
  getPendingExtractionTargets,
  parseExtractedDocumentDate,
  resolveExtractedCustomPropertyValues,
  resolveExtractedFileName,
  shouldPromptForExtraction,
} from './ai-extraction.models';
import type { AiExtractionResponse, PendingExtractionTargets } from './ai-extraction.models';

export async function promptForAiExtraction({
  aiServices,
  document,
  targets,
  filenamePattern,
  modelId,
}: {
  aiServices: AiServices;
  document: { content: string; name: string; originalName: string; organizationId: string };
  targets: PendingExtractionTargets;
  filenamePattern: string;
  modelId: string;
}) {
  return aiServices.generateStructuredData({
    modelId,
    organizationId: document.organizationId,
    source: 'ai-extraction',
    schema: buildAiExtractionSchema({ targets }),
    systemPrompt: buildAiExtractionSystemPrompt({ targets, filenamePattern }),
    userPrompt: buildAiExtractionUserPrompt({ document }),
  });
}

export async function extractDocumentMetadata({
  aiServices,
  documentId,
  organizationId,
  documentsRepository,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
  organizationsRepository,
  resolveOrganizationSettings,
  eventServices,
  logger = createLogger({ namespace: 'extractDocumentMetadata' }),
}: {
  aiServices: AiServices;
  documentId: string;
  organizationId: string;
  documentsRepository: DocumentsRepository;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
  organizationsRepository: OrganizationsRepository;
  resolveOrganizationSettings: ResolveOrganizationSettingsUsecase;
  eventServices: EventServices;
  logger?: Logger;
}) {
  const [{ document }, { organizationSettings }, { propertyDefinitions }, { values }] =
    await Promise.all([
      documentsRepository.getDocumentById({ documentId, organizationId }),
      resolveOrganizationSettings({ organizationId }),
      customPropertiesRepository.getOrganizationPropertyDefinitions({ organizationId }),
      customPropertiesRepository.getDocumentCustomPropertyValues({ documentId }),
    ]);

  if (!document) {
    throw createDocumentNotFoundError();
  }

  const extractionSettings = organizationSettings.ai.extraction;

  if (!extractionSettings.isEnabled) {
    logger.info(
      { documentId, organizationId },
      'AI extraction is disabled in organization settings. Skipping extraction.',
    );
    return;
  }

  if (!isNonEmptyString(document.content)) {
    logger.info({ documentId, organizationId }, 'No extracted content. Skipping AI extraction.');
    return;
  }

  const extractableProperties = getExtractableCustomProperties({ propertyDefinitions });
  const existingPropertyDefinitionIds = new Set(
    values.map((row) => row.value.propertyDefinitionId),
  );
  const targets = getPendingExtractionTargets({
    document,
    settings: extractionSettings,
    extractableProperties,
    existingPropertyDefinitionIds,
  });

  if (!shouldPromptForExtraction({ targets })) {
    logger.info(
      { documentId, organizationId },
      'Nothing to extract for this document. Skipping AI extraction.',
    );
    return;
  }

  const startedAt = Date.now();
  const extractionResponse = await promptForAiExtraction({
    aiServices,
    document,
    targets,
    filenamePattern: extractionSettings.filenamePattern,
    modelId: ensureModelId(extractionSettings.modelId),
  });
  const durationMs = Date.now() - startedAt;

  logger.info({ documentId, organizationId, durationMs }, 'AI extraction completed');

  await applyAiExtractionResult({
    document,
    documentId,
    organizationId,
    targets,
    extractionResponse,
    documentsRepository,
    customPropertiesRepository,
    customPropertiesOptionsRepository,
    organizationsRepository,
    eventServices,
    logger,
  });
}

async function applyAiExtractionResult({
  document,
  documentId,
  organizationId,
  targets,
  extractionResponse,
  documentsRepository,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
  organizationsRepository,
  eventServices,
  logger,
}: {
  document: {
    name: string;
    originalName: string;
    documentDate?: Date | null;
  };
  documentId: string;
  organizationId: string;
  targets: PendingExtractionTargets;
  extractionResponse: AiExtractionResponse;
  documentsRepository: DocumentsRepository;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
  organizationsRepository: OrganizationsRepository;
  eventServices: EventServices;
  logger: Logger;
}) {
  const changes: { name?: string; documentDate?: Date } = {};

  if (targets.shouldExtractDate) {
    const documentDate = parseExtractedDocumentDate({ value: extractionResponse.documentDate });

    if (documentDate) {
      changes.documentDate = documentDate;
    }
  }

  if (targets.shouldRename) {
    const name = resolveExtractedFileName({
      proposedName: extractionResponse.filename,
      originalName: document.originalName,
    });

    if (name) {
      changes.name = name;
    }
  }

  if (changes.name !== undefined || changes.documentDate !== undefined) {
    await updateDocument({
      documentId,
      organizationId,
      documentsRepository,
      eventServices,
      changes,
    });
  }

  if (!targets.shouldExtractCustomProperties) {
    return;
  }

  const customPropertyValues = resolveExtractedCustomPropertyValues({
    response: extractionResponse,
    propertiesToExtract: targets.propertiesToExtract,
  });

  const results = await Promise.allSettled(
    customPropertyValues.map(async ({ propertyDefinitionId, value }) =>
      setDocumentCustomPropertyValue({
        documentId,
        propertyDefinitionId,
        organizationId,
        value,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        documentsRepository,
      }),
    ),
  );

  const failedCount = results.filter((result) => result.status === 'rejected').length;

  if (failedCount > 0) {
    logger.warn(
      { documentId, organizationId, failedCount, total: results.length },
      'Some extracted custom properties could not be applied',
    );
  }
}
