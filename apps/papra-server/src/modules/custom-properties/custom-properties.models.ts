import type {
  CustomPropertyDefinition,
  CustomPropertyDefinitionWithOptions,
  CustomPropertySelectOption,
  DocumentCustomPropertyValue,
} from './custom-properties.types';
import { generateId } from '../shared/random/ids';
import {
  CUSTOM_PROPERTY_DEFINITION_ID_PREFIX,
  CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX,
  CUSTOM_PROPERTY_TYPES,
  DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX,
  SELECT_LIKE_PROPERTY_TYPES,
} from './custom-properties.constants';

export function generateCustomPropertyDefinitionId() {
  return generateId({ prefix: CUSTOM_PROPERTY_DEFINITION_ID_PREFIX });
}

export function generateCustomPropertySelectOptionId() {
  return generateId({ prefix: CUSTOM_PROPERTY_SELECT_OPTION_ID_PREFIX });
}

export function generateDocumentCustomPropertyValueId() {
  return generateId({ prefix: DOCUMENT_CUSTOM_PROPERTY_VALUE_ID_PREFIX });
}

export function formatPropertyDefinitionForApi({ propertyDefinition }: { propertyDefinition: CustomPropertyDefinition | CustomPropertyDefinitionWithOptions }) {
  return propertyDefinition;
}

export function formatPropertyDefinitionsForApi({ propertyDefinitions }: { propertyDefinitions: (CustomPropertyDefinition | CustomPropertyDefinitionWithOptions)[] }) {
  return propertyDefinitions.map(propertyDefinition => formatPropertyDefinitionForApi({ propertyDefinition }));
}

export function formatSelectOptionForApi({ option }: { option: CustomPropertySelectOption }) {
  return {
    id: option.id,
    value: option.value,
    color: option.color,
  };
}

export function formatPropertyValueForApi({ propertyValue, propertyDefinition, selectOption }: { propertyValue: DocumentCustomPropertyValue; propertyDefinition: CustomPropertyDefinition; selectOption?: CustomPropertySelectOption | null }) {
  const { type } = propertyDefinition;

  return {
    propertyDefinitionId: propertyValue.propertyDefinitionId,
    documentId: propertyValue.documentId,
    value: extractTypedValue({ propertyValue, type, selectOption }),
    createdAt: propertyValue.createdAt,
    updatedAt: propertyValue.updatedAt,
  };
}

export function extractTypedValue({ propertyValue, type, selectOption }: { propertyValue: DocumentCustomPropertyValue; type: string; selectOption?: CustomPropertySelectOption | null }) {
  switch (type) {
    case CUSTOM_PROPERTY_TYPES.TEXT:
      return propertyValue.textValue;
    case CUSTOM_PROPERTY_TYPES.SELECT:
      return selectOption ? formatSelectOptionForApi({ option: selectOption }) : null;
    case CUSTOM_PROPERTY_TYPES.MULTI_SELECT:
      return selectOption ? formatSelectOptionForApi({ option: selectOption }) : null;
    case CUSTOM_PROPERTY_TYPES.NUMBER:
      return propertyValue.numberValue;
    case CUSTOM_PROPERTY_TYPES.DATE:
      return propertyValue.dateValue;
    case CUSTOM_PROPERTY_TYPES.BOOLEAN:
      return propertyValue.booleanValue;
    default:
      return null;
  }
}

export function formatDocumentPropertyValuesForApi({ propertyValues, propertyDefinitions, selectOptions }: { propertyValues: DocumentCustomPropertyValue[]; propertyDefinitions: CustomPropertyDefinition[]; selectOptions?: (CustomPropertySelectOption | null)[] }) {
  const definitionsById = new Map(propertyDefinitions.map(d => [d.id, d]));

  // Group multi-select values
  const grouped = new Map<string, { definition: CustomPropertyDefinition; values: DocumentCustomPropertyValue[]; options: (CustomPropertySelectOption | null)[] }>();

  for (let i = 0; i < propertyValues.length; i++) {
    const value = propertyValues[i]!;
    const definition = definitionsById.get(value.propertyDefinitionId);
    if (!definition) {
      continue;
    }

    const selectOption = selectOptions?.[i] ?? null;

    const key = value.propertyDefinitionId;
    const existing = grouped.get(key);
    if (existing) {
      existing.values.push(value);
      existing.options.push(selectOption);
    } else {
      grouped.set(key, { definition, values: [value], options: [selectOption] });
    }
  }

  return Array
    .from(grouped.values())
    .sort((a, b) => a.definition.displayOrder - b.definition.displayOrder)
    .map(({ definition, values, options }) => {
      if (definition.type === CUSTOM_PROPERTY_TYPES.MULTI_SELECT) {
        return {
          propertyDefinitionId: definition.id,
          name: definition.name,
          value: options
            .filter((o): o is CustomPropertySelectOption => o !== null)
            .map(o => formatSelectOptionForApi({ option: o })),
        };
      }

      const [propertyValue] = values;
      const [selectOption] = options;
      if (!propertyValue) {
        return {
          propertyDefinitionId: definition.id,
          name: definition.name,
          value: null,
        };
      }

      return {
        propertyDefinitionId: definition.id,
        name: definition.name,
        value: extractTypedValue({ propertyValue, type: definition.type, selectOption }),
      };
    });
}

export function isSelectLikeType({ type }: { type: string }): boolean {
  return SELECT_LIKE_PROPERTY_TYPES.includes(type);
}
