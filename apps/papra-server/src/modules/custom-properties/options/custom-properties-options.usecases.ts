import type { CustomPropertiesOptionsRepository } from './custom-properties-options.repository';
import { createCustomPropertySelectOptionNotFoundError } from './custom-properties-options.errors';

export async function ensureOptionExists({
  propertyDefinitionId,
  optionId,
  customPropertiesOptionsRepository,
}: {
  propertyDefinitionId: string;
  optionId: string;
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
}) {
  const { option } = await customPropertiesOptionsRepository.getSelectOption({ optionId, propertyDefinitionId });

  if (!option) {
    throw createCustomPropertySelectOptionNotFoundError();
  }
}

export async function ensureOptionsExist({
  propertyDefinitionId,
  optionIds,
  customPropertiesOptionsRepository,
}: {
  propertyDefinitionId: string;
  optionIds: string[];
  customPropertiesOptionsRepository: CustomPropertiesOptionsRepository;
}) {
  const { options } = await customPropertiesOptionsRepository.getSelectOptions({ optionsIds: optionIds, propertyDefinitionId });

  const existingOptionIds = new Set(options.map(option => option.id));

  for (const optionId of optionIds) {
    if (!existingOptionIds.has(optionId)) {
      throw createCustomPropertySelectOptionNotFoundError();
    }
  }
}
