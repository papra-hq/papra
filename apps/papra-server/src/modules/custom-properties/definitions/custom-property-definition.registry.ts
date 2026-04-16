import type { CustomPropertyTypeDefinition } from './custom-property-definition.models';
import * as v from 'valibot';
import { createError } from '../../shared/errors/errors';
import { booleanCustomPropertyDefinition } from './boolean/boolean.custom-property-definition';
import { dateCustomPropertyDefinition } from './date/date.custom-property-definition';
import { documentRelationCustomPropertyDefinition } from './document-relation/document-relation.custom-property-definition';
import { multiSelectCustomPropertyDefinition } from './multi-select/multi-select.custom-property-definition';
import { numberCustomPropertyDefinition } from './number/number.custom-property-definition';
import { selectCustomPropertyDefinition } from './select/select.custom-property-definition';
import { textCustomPropertyDefinition } from './text/text.custom-property-definition';
import { userRelationCustomPropertyDefinition } from './user-relation/user-relation.custom-property-definition';

export const customPropertyDefinitionRegistry = {
  [textCustomPropertyDefinition.typeName]: textCustomPropertyDefinition,
  [numberCustomPropertyDefinition.typeName]: numberCustomPropertyDefinition,
  [dateCustomPropertyDefinition.typeName]: dateCustomPropertyDefinition,
  [booleanCustomPropertyDefinition.typeName]: booleanCustomPropertyDefinition,
  [selectCustomPropertyDefinition.typeName]: selectCustomPropertyDefinition,
  [multiSelectCustomPropertyDefinition.typeName]: multiSelectCustomPropertyDefinition,
  [userRelationCustomPropertyDefinition.typeName]: userRelationCustomPropertyDefinition,
  [documentRelationCustomPropertyDefinition.typeName]: documentRelationCustomPropertyDefinition,
};

export const customPropertyDefinitions = Object.values(customPropertyDefinitionRegistry);

export type CustomPropertyType = keyof typeof customPropertyDefinitionRegistry;

export function getCustomPropertyTypeDefinition({ type }: { type: string }) {
  const definition = customPropertyDefinitionRegistry[type as CustomPropertyType] as CustomPropertyTypeDefinition | undefined;

  if (!definition) {
    throw createError({
      message: `Custom property type "${type}" is not supported`,
      code: 'unsupported_custom_property_type',
      statusCode: 400,
    });
  }

  return definition;
}

export const createPropertyDefinitionBodySchema = v.variant('type', customPropertyDefinitions.map(def => def.definition.createPropertySchema));

export type CreatePropertyDefinition = v.InferOutput<typeof createPropertyDefinitionBodySchema>;
