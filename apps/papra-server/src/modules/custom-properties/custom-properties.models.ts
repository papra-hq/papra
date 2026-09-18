import type { DocumentCustomPropertyValueWithRelatedInfo } from './definitions/custom-property-definition.models';
import { getCustomPropertyTypeDefinition } from './definitions/custom-property-definition.registry';

export function aggregateDocumentCustomPropertyValues({
  rawValues,
}: {
  rawValues: DocumentCustomPropertyValueWithRelatedInfo[];
}) {
  const groupedRows = new Map<
    string,
    {
      definition: DocumentCustomPropertyValueWithRelatedInfo['definition'];
      rows: DocumentCustomPropertyValueWithRelatedInfo[];
    }
  >();

  for (const row of rawValues) {
    const existing = groupedRows.get(row.definition.id);

    if (existing) {
      existing.rows.push(row);
    } else {
      groupedRows.set(row.definition.id, { definition: row.definition, rows: [row] });
    }
  }

  return [...groupedRows.values()].map(({ definition, rows }) => {
    const customPropertyTypeDefinition = getCustomPropertyTypeDefinition({ type: definition.type });

    const value = customPropertyTypeDefinition.value.fromDb({ rows });

    return {
      propertyDefinitionId: definition.id,
      key: definition.key,
      name: definition.name,
      type: definition.type,
      value,
    };
  });
}

export type DocumentCustomPropertyForApi = {
  propertyDefinitionId: string;
  key: string;
  name: string;
  type: string;
  displayOrder: number;
  value: unknown;
};

export function buildCustomPropertiesArray({
  rawValues,
  propertyDefinitions,
}: {
  rawValues: DocumentCustomPropertyValueWithRelatedInfo[];
  propertyDefinitions: {
    id: string;
    key: string;
    name: string;
    type: string;
    displayOrder: number;
  }[];
}): DocumentCustomPropertyForApi[] {
  const aggregated = aggregateDocumentCustomPropertyValues({ rawValues });
  const valuesByDefinitionId = Object.fromEntries(
    aggregated.map(({ propertyDefinitionId, value }) => [propertyDefinitionId, value]),
  );

  return propertyDefinitions.map((def) => ({
    propertyDefinitionId: def.id,
    key: def.key,
    name: def.name,
    type: def.type,
    displayOrder: def.displayOrder,
    value: valuesByDefinitionId[def.id] ?? null,
  }));
}
