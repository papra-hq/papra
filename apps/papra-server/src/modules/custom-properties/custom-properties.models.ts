import type { DocumentCustomPropertyValueWithRelatedInfo } from './definitions/custom-property-definition.models';
import { getCustomPropertyTypeDefinition } from './definitions/custom-property-definition.registry';

export function aggregateDocumentCustomPropertyValues({ rawValues }: { rawValues: DocumentCustomPropertyValueWithRelatedInfo[] }) {
  const groupedRows = new Map<string, { definition: DocumentCustomPropertyValueWithRelatedInfo['definition']; rows: DocumentCustomPropertyValueWithRelatedInfo[] }>();

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
  key: string;
  name: string;
  type: string;
  displayOrder: number;
  value: unknown;
};

export function buildCustomPropertiesArray({ rawValues, propertyDefinitions }: { rawValues: DocumentCustomPropertyValueWithRelatedInfo[]; propertyDefinitions: { key: string; name: string; type: string; displayOrder: number }[] }): DocumentCustomPropertyForApi[] {
  const aggregated = aggregateDocumentCustomPropertyValues({ rawValues });
  const valuesByKey = Object.fromEntries(aggregated.map(({ key, value }) => [key, value]));

  return propertyDefinitions.map(def => ({
    key: def.key,
    name: def.name,
    type: def.type,
    displayOrder: def.displayOrder,
    value: valuesByKey[def.key] ?? null,
  }));
}
