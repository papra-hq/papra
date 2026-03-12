import type { Config } from '../config/config.types';
import type { CustomPropertyType } from './custom-properties.constants';
import type { CustomPropertiesRepository } from './custom-properties.repository';
import type { CustomPropertyDefinitionWithOptions, CustomPropertySelectOption } from './custom-properties.types';
import { CUSTOM_PROPERTY_TYPES, CUSTOM_PROPERTY_TYPES_LIST } from './custom-properties.constants';
import {
  createCustomPropertyDefinitionNotFoundError,
  createCustomPropertySelectOptionNotFoundError,
  createCustomPropertyValueInvalidError,
  createOrganizationCustomPropertyLimitReachedError,
} from './custom-properties.errors';
import { isSelectLikeType } from './custom-properties.models';

export async function checkIfOrganizationCanCreateNewPropertyDefinition({
  organizationId,
  config,
  customPropertiesRepository,
}: {
  organizationId: string;
  config: Config;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { count } = await customPropertiesRepository.getOrganizationPropertyDefinitionsCount({ organizationId });

  if (count >= config.customProperties.maxCustomPropertiesPerOrganization) {
    throw createOrganizationCustomPropertyLimitReachedError();
  }
}

export async function createPropertyDefinition({
  organizationId,
  name,
  description,
  type,
  color,
  isRequired,
  displayOrder,
  options,
  config,
  customPropertiesRepository,
}: {
  organizationId: string;
  name: string;
  description?: string | null;
  type: CustomPropertyType;
  color?: string | null;
  isRequired?: boolean;
  displayOrder?: number;
  options?: { value: string; color?: string | null; displayOrder?: number }[];
  config: Config;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  await checkIfOrganizationCanCreateNewPropertyDefinition({ organizationId, config, customPropertiesRepository });

  if (!CUSTOM_PROPERTY_TYPES_LIST.includes(type)) {
    throw createCustomPropertyValueInvalidError({ message: `Invalid property type: ${type}` });
  }

  const { propertyDefinition } = await customPropertiesRepository.createPropertyDefinition({
    definition: {
      organizationId,
      name,
      description,
      type,
      color,
      isRequired,
      displayOrder,
    },
  });

  // Create select options if this is a select-like type
  let createdOptions: CustomPropertySelectOption[] = [];
  if (isSelectLikeType({ type }) && options && options.length > 0) {
    const { options: created } = await customPropertiesRepository.createSelectOptions({
      options: options.map((option, index) => ({
        propertyDefinitionId: propertyDefinition.id,
        value: option.value,
        color: option.color,
        displayOrder: option.displayOrder ?? index,
      })),
    });
    createdOptions = created;
  }

  return {
    propertyDefinition: {
      ...propertyDefinition,
      options: createdOptions,
    },
  };
}

export async function getPropertyDefinitionOrThrow({
  propertyDefinitionId,
  organizationId,
  customPropertiesRepository,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { propertyDefinition } = await customPropertiesRepository.getPropertyDefinitionById({
    propertyDefinitionId,
    organizationId,
  });

  if (!propertyDefinition) {
    throw createCustomPropertyDefinitionNotFoundError();
  }

  return { propertyDefinition };
}

export async function updatePropertyDefinition({
  propertyDefinitionId,
  organizationId,
  name,
  description,
  color,
  isRequired,
  displayOrder,
  options,
  customPropertiesRepository,
}: {
  propertyDefinitionId: string;
  organizationId: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  isRequired?: boolean;
  displayOrder?: number;
  options?: { id?: string; value: string; color?: string | null; displayOrder?: number }[];
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { propertyDefinition: existingDefinition } = await getPropertyDefinitionOrThrow({
    propertyDefinitionId,
    organizationId,
    customPropertiesRepository,
  });

  const { propertyDefinition } = await customPropertiesRepository.updatePropertyDefinition({
    propertyDefinitionId,
    name,
    description,
    color,
    isRequired,
    displayOrder,
  });

  // Handle options update for select-like types
  let updatedOptions = existingDefinition.options;
  if (isSelectLikeType({ type: existingDefinition.type }) && options !== undefined) {
    updatedOptions = await syncSelectOptions({
      propertyDefinitionId,
      newOptions: options,
      customPropertiesRepository,
    });
  }

  return {
    propertyDefinition: {
      ...propertyDefinition,
      options: updatedOptions,
    },
  };
}

async function syncSelectOptions({
  propertyDefinitionId,
  newOptions,
  customPropertiesRepository,
}: {
  propertyDefinitionId: string;
  newOptions: { id?: string; value: string; color?: string | null; displayOrder?: number }[];
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { options: existingOptions } = await customPropertiesRepository.getSelectOptionsByDefinitionId({ propertyDefinitionId });

  const existingOptionsById = new Map(existingOptions.map(o => [o.id, o]));

  // Options with an id are updates, options without an id are new
  const optionsToUpdate = newOptions.filter(o => o.id && existingOptionsById.has(o.id));
  const optionsToCreate = newOptions.filter(o => !o.id);

  // Options that exist in DB but are not in the new list are to be deleted
  const newOptionIds = new Set(newOptions.filter(o => o.id).map(o => o.id!));
  const optionIdsToDelete = existingOptions.filter(o => !newOptionIds.has(o.id)).map(o => o.id);

  // Delete removed options (cascade will clean up document values referencing them)
  if (optionIdsToDelete.length > 0) {
    await customPropertiesRepository.deleteSelectOptionsByIds({ optionIds: optionIdsToDelete });
  }

  // Update existing options
  for (const option of optionsToUpdate) {
    await customPropertiesRepository.updateSelectOption({
      optionId: option.id!,
      value: option.value,
      color: option.color,
      displayOrder: option.displayOrder,
    });
  }

  // Create new options
  if (optionsToCreate.length > 0) {
    await customPropertiesRepository.createSelectOptions({
      options: optionsToCreate.map((option, index) => ({
        propertyDefinitionId,
        value: option.value,
        color: option.color,
        displayOrder: option.displayOrder ?? (existingOptions.length + index),
      })),
    });
  }

  // Re-fetch to return the current state
  const { options: updatedOptions } = await customPropertiesRepository.getSelectOptionsByDefinitionId({ propertyDefinitionId });
  return updatedOptions;
}

export async function setDocumentPropertyValue({
  documentId,
  propertyDefinitionId,
  organizationId,
  value,
  customPropertiesRepository,
}: {
  documentId: string;
  propertyDefinitionId: string;
  organizationId: string;
  value: string | number | boolean | string[] | null;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  const { propertyDefinition } = await getPropertyDefinitionOrThrow({
    propertyDefinitionId,
    organizationId,
    customPropertiesRepository,
  });

  // Handle null value (clearing the property)
  if (value === null) {
    await customPropertiesRepository.deleteDocumentPropertyValue({
      documentId,
      propertyDefinitionId,
    });
    return { propertyValue: null };
  }

  // Validate and set the value based on type
  switch (propertyDefinition.type) {
    case CUSTOM_PROPERTY_TYPES.TEXT:
      return setTextValue({ documentId, propertyDefinitionId, value, customPropertiesRepository });
    case CUSTOM_PROPERTY_TYPES.NUMBER:
      return setNumberValue({ documentId, propertyDefinitionId, value, customPropertiesRepository });
    case CUSTOM_PROPERTY_TYPES.DATE:
      return setDateValue({ documentId, propertyDefinitionId, value, customPropertiesRepository });
    case CUSTOM_PROPERTY_TYPES.BOOLEAN:
      return setBooleanValue({ documentId, propertyDefinitionId, value, customPropertiesRepository });
    case CUSTOM_PROPERTY_TYPES.SELECT:
      return setSelectValue({ documentId, propertyDefinitionId, value, propertyDefinition, customPropertiesRepository });
    case CUSTOM_PROPERTY_TYPES.MULTI_SELECT:
      return setMultiSelectValue({ documentId, propertyDefinitionId, value, propertyDefinition, customPropertiesRepository });
    default:
      throw createCustomPropertyValueInvalidError();
  }
}

async function setTextValue({ documentId, propertyDefinitionId, value, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  if (typeof value !== 'string') {
    throw createCustomPropertyValueInvalidError({ message: 'Text property value must be a string.' });
  }

  return customPropertiesRepository.setDocumentPropertyValue({
    documentId,
    propertyDefinitionId,
    textValue: value,
  });
}

async function setNumberValue({ documentId, propertyDefinitionId, value, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw createCustomPropertyValueInvalidError({ message: 'Number property value must be a valid number.' });
  }

  return customPropertiesRepository.setDocumentPropertyValue({
    documentId,
    propertyDefinitionId,
    numberValue: value,
  });
}

async function setDateValue({ documentId, propertyDefinitionId, value, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  let dateValue: Date;

  if (typeof value === 'string') {
    dateValue = new Date(value);
  } else if (typeof value === 'number') {
    dateValue = new Date(value);
  } else {
    throw createCustomPropertyValueInvalidError({ message: 'Date property value must be a valid date string or timestamp.' });
  }

  if (Number.isNaN(dateValue.getTime())) {
    throw createCustomPropertyValueInvalidError({ message: 'Date property value must be a valid date.' });
  }

  return customPropertiesRepository.setDocumentPropertyValue({
    documentId,
    propertyDefinitionId,
    dateValue,
  });
}

async function setBooleanValue({ documentId, propertyDefinitionId, value, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  if (typeof value !== 'boolean') {
    throw createCustomPropertyValueInvalidError({ message: 'Boolean property value must be true or false.' });
  }

  return customPropertiesRepository.setDocumentPropertyValue({
    documentId,
    propertyDefinitionId,
    booleanValue: value,
  });
}

async function setSelectValue({ documentId, propertyDefinitionId, value, propertyDefinition, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  propertyDefinition: CustomPropertyDefinitionWithOptions;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  if (typeof value !== 'string') {
    throw createCustomPropertyValueInvalidError({ message: 'Select property value must be a string (option ID).' });
  }

  const matchingOption = propertyDefinition.options.find(option => option.id === value);
  if (!matchingOption) {
    throw createCustomPropertySelectOptionNotFoundError();
  }

  return customPropertiesRepository.setDocumentPropertyValue({
    documentId,
    propertyDefinitionId,
    selectOptionId: matchingOption.id,
  });
}

async function setMultiSelectValue({ documentId, propertyDefinitionId, value, propertyDefinition, customPropertiesRepository }: {
  documentId: string;
  propertyDefinitionId: string;
  value: unknown;
  propertyDefinition: CustomPropertyDefinitionWithOptions;
  customPropertiesRepository: CustomPropertiesRepository;
}) {
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw createCustomPropertyValueInvalidError({ message: 'Multi-select property value must be an array of strings (option IDs).' });
  }

  const validOptionIds = new Set(propertyDefinition.options.map(option => option.id));
  const invalidIds = value.filter(v => !validOptionIds.has(v));

  if (invalidIds.length > 0) {
    throw createCustomPropertySelectOptionNotFoundError();
  }

  return customPropertiesRepository.setDocumentMultiSelectPropertyValues({
    documentId,
    propertyDefinitionId,
    selectOptionIds: value,
  });
}
