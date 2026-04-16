import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { CustomPropertiesRepository } from './custom-properties.repository';
import type { BaseUpdateFields } from './definitions/custom-property-definition.models';
import type { CreatePropertyDefinition } from './definitions/custom-property-definition.registry';
import type { CustomPropertiesOptionsRepository } from './options/custom-properties-options.repository';
import * as v from 'valibot';

import {
  createCustomPropertyDefinitionInvalidUpdateError,
  createCustomPropertyDefinitionNotFoundError,
  createCustomPropertyValueInvalidError,
  createOrganizationCustomPropertyLimitReachedError,
} from './custom-properties.errors';
import { getCustomPropertyTypeDefinition } from './definitions/custom-property-definition.registry';

export async function createPropertyDefinition({
  organizationId,
  definition,
  config,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
}: {
  organizationId: string;
  definition: CreatePropertyDefinition;
  config: Config;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
}) {
  const { count } = await customPropertiesRepository.getOrganizationPropertyDefinitionsCount({ organizationId });

  if (count >= config.customProperties.maxCustomPropertiesPerOrganization) {
    throw createOrganizationCustomPropertyLimitReachedError();
  }

  const { propertyDefinition } = await customPropertiesRepository.createPropertyDefinition({
    definition: {
      organizationId,
      name: definition.name,
      description: definition.description,
      displayOrder: definition.displayOrder,
      type: definition.type,
    },
  });

  const customPropertyTypeDefinition = getCustomPropertyTypeDefinition({ type: propertyDefinition.type });

  await customPropertyTypeDefinition.definition.onCreate?.({
    apiInput: definition,
    propertyDefinition,
    customPropertiesRepository,
    customPropertiesOptionsRepository,
  });

  return { propertyDefinition };
}

export async function updatePropertyDefinition({
  propertyDefinitionId,
  organizationId,
  rawDefinition,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  rawDefinition: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
}) {
  const { definition: existingDefinition } = await ensurePropertyDefinitionExists({ propertyDefinitionId, organizationId, customPropertiesRepository });

  const customPropertyTypeDefinition = getCustomPropertyTypeDefinition({ type: existingDefinition.type });

  const parseResult = v.safeParse(customPropertyTypeDefinition.definition.updatePropertySchema, rawDefinition);

  if (!parseResult.success) {
    throw createCustomPropertyDefinitionInvalidUpdateError();
  }

  const definition = parseResult.output as BaseUpdateFields & Record<string, unknown>;

  const { propertyDefinition } = await customPropertiesRepository.updatePropertyDefinition({
    propertyDefinitionId,
    organizationId,
    name: definition.name,
    description: definition.description,
    displayOrder: definition.displayOrder,
  });

  await customPropertyTypeDefinition.definition.onUpdate?.({
    apiInput: definition,
    propertyDefinition,
    customPropertiesRepository,
    customPropertiesOptionsRepository,
  });

  return { propertyDefinition };
}

export async function deletePropertyDefinition({
  propertyDefinitionId,
  organizationId,
  customPropertiesRepository,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  await ensurePropertyDefinitionExists({ propertyDefinitionId, organizationId, customPropertiesRepository });

  await customPropertiesRepository.deletePropertyDefinition({ propertyDefinitionId, organizationId });
}

export async function setDocumentCustomPropertyValue({
  documentId,
  propertyDefinitionId,
  organizationId,
  value,
  customPropertiesRepository,
  customPropertiesOptionsRepository,
  organizationsRepository,
  documentsRepository,
}: {
  documentId: string;
  propertyDefinitionId: string;
  organizationId: string;
  value: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
  organizationsRepository: OrganizationsRepository;
  documentsRepository: DocumentsRepository;
}) {
  const { definition: customProperty } = await ensurePropertyDefinitionExists({ propertyDefinitionId, organizationId, customPropertiesRepository });

  const customPropertyTypeDefinition = getCustomPropertyTypeDefinition({ type: customProperty.type });

  const parseResult = v.safeParse(customPropertyTypeDefinition.value.inputSchema, value);

  if (!parseResult.success) {
    throw createCustomPropertyValueInvalidError();
  }

  const parsedValue = parseResult.output;

  await customPropertyTypeDefinition.value.extendInputValidation?.({
    value: parsedValue,
    customProperty,
    customPropertiesRepository,
    customPropertiesOptionsRepository,
    organizationsRepository,
    documentsRepository,
  });

  const dbValue = customPropertyTypeDefinition.value.toDb({ value: parsedValue });

  await customPropertiesRepository.setDocumentCustomPropertyValue({
    documentId,
    propertyDefinitionId,
    values: Array.isArray(dbValue) ? dbValue : [dbValue],
  });
}

export async function deleteDocumentCustomPropertyValue({
  documentId,
  propertyDefinitionId,
  organizationId,
  customPropertiesRepository,
}: {
  documentId: string;
  propertyDefinitionId: string;
  organizationId: string;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  await ensurePropertyDefinitionExists({ propertyDefinitionId, organizationId, customPropertiesRepository });

  await customPropertiesRepository.deleteDocumentCustomPropertyValue({ documentId, propertyDefinitionId });
}

export async function ensurePropertyDefinitionExists({
  propertyDefinitionId,
  organizationId,
  customPropertiesRepository,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { definition } = await customPropertiesRepository.getPropertyDefinitionById({ propertyDefinitionId, organizationId });

  if (!definition) {
    throw createCustomPropertyDefinitionNotFoundError();
  }

  return { definition };
}
