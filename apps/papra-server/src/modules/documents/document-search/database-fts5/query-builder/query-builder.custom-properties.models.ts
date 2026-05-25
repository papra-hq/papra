import type { CustomPropertyDefinitionsByKey } from './query-builder.custom-properties';
import { generatePropertyKey } from '../../../../custom-properties/custom-properties.repository.models';

export function getCustomPropertyDefinition({ name, customPropertyDefinitionsByKey }: { name: string; customPropertyDefinitionsByKey: CustomPropertyDefinitionsByKey }) {
  const key = generatePropertyKey({ name });

  return customPropertyDefinitionsByKey[key];
}
