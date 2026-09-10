import type { Logger } from '@crowlog/logger';
import type { AiServices } from '../ai/ai.services';
import type { EventServices } from '../app/events/events.services';
import type { Config } from '../config/config.types';
import type { CustomPropertiesRepository } from '../custom-properties/custom-properties.repository';
import type { CreatePropertyDefinition } from '../custom-properties/definitions/custom-property-definition.registry';
import type { CustomPropertiesOptionsRepository } from '../custom-properties/options/custom-properties-options.repository';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { TagsRepository } from '../tags/tags.repository';
import { ensureModelId } from '../ai/ai.models';
import {
  createPropertyDefinition,
  setDocumentCustomPropertyValue,
} from '../custom-properties/custom-properties.usecases';
import { createDocumentNotFoundError } from '../documents/documents.errors';
import { createLogger } from '../shared/logger/logger';
import { applyTagsToDocuments, createTag } from '../tags/tags.usecases';
import { RECEIPT_PROPERTY_FIELDS } from './receipt-extraction.constants';
import {
  buildReceiptExtractionSchema,
  buildReceiptExtractionSystemPrompt,
  buildReceiptExtractionUserPrompt,
  buildReceiptValuesToWrite,
  getCategoryOptionsToSync,
  matchReceiptPropertyDefinitions,
  normalizeReceiptExtraction,
} from './receipt-extraction.models';

const RECEIPT_TAG_COLOR = '#2F9E44';

export async function extractReceiptData({
  documentId,
  organizationId,
  aiServices,
  documentsRepository,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
  organizationsRepository,
  tagsRepository,
  eventServices,
  config,
  now = new Date(),
  logger = createLogger({ namespace: 'receipt-extraction' }),
}: {
  documentId: string;
  organizationId: string;
  aiServices: AiServices;
  documentsRepository: DocumentsRepository;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
  organizationsRepository: OrganizationsRepository;
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  config: Config;
  now?: Date;
  logger?: Logger;
}) {
  const { document } = await documentsRepository.getDocumentById({ documentId, organizationId });

  if (!document) {
    throw createDocumentNotFoundError();
  }

  if (document.content.trim().length === 0) {
    logger.info({ documentId, organizationId }, 'No extracted text, skipping receipt extraction');
    return { isReceipt: false as const };
  }

  const { categories, overwriteExistingValues, tagName } = config.receiptExtraction;
  const modelId = ensureModelId(config.receiptExtraction.modelId ?? config.ai.defaultModelId);

  const startedAt = Date.now();
  const response = await aiServices.generateStructuredData({
    modelId,
    organizationId,
    source: 'receipt-extraction',
    schema: buildReceiptExtractionSchema({ categories }),
    systemPrompt: buildReceiptExtractionSystemPrompt({ categories }),
    userPrompt: buildReceiptExtractionUserPrompt({ document }),
  });

  const { isReceipt, fields } = normalizeReceiptExtraction({ response, categories, now });

  logger.info(
    { documentId, organizationId, isReceipt, durationMs: Date.now() - startedAt },
    'Receipt extraction completed',
  );

  if (!isReceipt) {
    return { isReceipt: false as const };
  }

  // Properties are created lazily on the first detected receipt, so organizations
  // that never upload receipts do not get cluttered with unused properties.
  const { definitionsByField } = await ensureReceiptPropertyDefinitions({
    organizationId,
    categories,
    config,
    customPropertiesRepository,
    customPropertiesOptionsRepository,
    logger,
  });

  const { values: existingValues } =
    await customPropertiesRepository.getDocumentCustomPropertyValues({
      documentId,
    });

  const { values } = buildReceiptValuesToWrite({
    fields,
    definitionsByField,
    propertyDefinitionIdsWithValues: new Set(
      existingValues.map(({ value }) => value.propertyDefinitionId),
    ),
    overwriteExistingValues,
  });

  const writtenFields: string[] = [];

  for (const { field, propertyDefinitionId, value } of values) {
    try {
      await setDocumentCustomPropertyValue({
        documentId,
        propertyDefinitionId,
        organizationId,
        value,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
        organizationsRepository,
        documentsRepository,
      });
      writtenFields.push(field);
    } catch (error) {
      logger.error({ error, documentId, organizationId, field }, 'Failed to set receipt field');
    }
  }

  if (tagName) {
    await applyReceiptTag({
      documentId,
      organizationId,
      tagName,
      config,
      tagsRepository,
      eventServices,
      logger,
    });
  }

  logger.info({ documentId, organizationId, writtenFields }, 'Receipt fields saved');

  return { isReceipt: true as const, fields, writtenFields };
}

async function ensureReceiptPropertyDefinitions({
  organizationId,
  categories,
  config,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
  logger,
}: {
  organizationId: string;
  categories: string[];
  config: Config;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
  logger: Logger;
}) {
  const { propertyDefinitions } =
    await customPropertiesRepository.getOrganizationPropertyDefinitions({
      organizationId,
    });

  const { matched, missing, conflicting } = matchReceiptPropertyDefinitions({
    propertyDefinitions,
  });

  if (conflicting.length > 0) {
    logger.warn(
      { organizationId, conflicting },
      'Existing custom properties share a receipt field name but have another type, skipping them',
    );
  }

  let hasChanges = false;

  for (const field of missing) {
    const { name, type, description } = RECEIPT_PROPERTY_FIELDS[field];

    const definition = (
      type === 'select'
        ? { type, name, description, options: categories.map((category) => ({ name: category })) }
        : { type, name, description }
    ) as CreatePropertyDefinition;

    try {
      await createPropertyDefinition({
        organizationId,
        definition,
        config,
        customPropertiesRepository,
        customPropertiesOptionsRepository,
      });
      hasChanges = true;
    } catch (error) {
      // Most likely the organization custom property limit, keep going with what exists
      logger.error({ error, organizationId, field }, 'Failed to create receipt custom property');
      break;
    }
  }

  const categoryDefinition = matched.get('category');

  if (categoryDefinition) {
    const { optionsToSync } = getCategoryOptionsToSync({
      existingOptions: categoryDefinition.options,
      categories,
    });

    if (optionsToSync) {
      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: categoryDefinition.id,
        options: optionsToSync,
      });
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return { definitionsByField: matched };
  }

  // Re-read to get ids of created definitions and options
  const { propertyDefinitions: refreshed } =
    await customPropertiesRepository.getOrganizationPropertyDefinitions({
      organizationId,
    });

  return {
    definitionsByField: matchReceiptPropertyDefinitions({ propertyDefinitions: refreshed }).matched,
  };
}

async function applyReceiptTag({
  documentId,
  organizationId,
  tagName,
  config,
  tagsRepository,
  eventServices,
  logger,
}: {
  documentId: string;
  organizationId: string;
  tagName: string;
  config: Config;
  tagsRepository: TagsRepository;
  eventServices: EventServices;
  logger: Logger;
}) {
  try {
    const { tags } = await tagsRepository.getOrganizationTags({ organizationId });
    const existingTag = tags.find((tag) => tag.name.toLowerCase() === tagName.toLowerCase());

    let tagId = existingTag?.id;

    if (!tagId) {
      const { tag } = await createTag({
        organizationId,
        name: tagName,
        color: RECEIPT_TAG_COLOR,
        description: 'Receipts and invoices detected by AI',
        config,
        tagsRepository,
      });
      tagId = tag?.id;
    }

    if (!tagId) {
      return;
    }

    await applyTagsToDocuments({
      documentIds: [documentId],
      addTagIds: [tagId],
      organizationId,
      tagsRepository,
      eventServices,
    });
  } catch (error) {
    logger.error({ error, documentId, organizationId }, 'Failed to apply receipt tag');
  }
}
