import type {
  CustomPropertyDefinition,
  DocumentCustomProperty,
} from '@/modules/custom-properties/custom-properties.types';
import {
  rawPropertyValueAsOption,
  rawPropertyValueAsOptionArray,
  rawPropertyValueAsRelatedDocumentArray,
  rawPropertyValueAsUserArray,
} from '@/modules/custom-properties/custom-properties.models';
import { buildLocalStorageKey } from '@/modules/shared/signals/persistence/persistence.models';

export const DEFAULT_DOCUMENT_COLUMN_IDS = ['tags', 'documentDate', 'createdAt'] as const;

export function getDocumentColumnsStorageKey({ organizationId }: { organizationId: string }) {
  return buildLocalStorageKey('documents', 'columns', organizationId);
}

export function deserializeDocumentColumnIds(value: string): string[] {
  const parsedValue: unknown = JSON.parse(value);

  if (!Array.isArray(parsedValue) || parsedValue.some((columnId) => typeof columnId !== 'string')) {
    throw new TypeError('Document column IDs must be an array of strings');
  }

  return [...new Set(parsedValue)];
}

export function toggleDocumentColumn({
  selectedColumnIds,
  columnId,
  isSelected,
}: {
  selectedColumnIds: string[];
  columnId: string;
  isSelected: boolean;
}) {
  if (isSelected) {
    return selectedColumnIds.includes(columnId)
      ? selectedColumnIds
      : [...selectedColumnIds, columnId];
  }

  return selectedColumnIds.filter((id) => id !== columnId);
}

export function moveDocumentColumn({
  selectedColumnIds,
  availableColumnIds = selectedColumnIds,
  columnId,
  direction,
}: {
  selectedColumnIds: string[];
  availableColumnIds?: string[];
  columnId: string;
  direction: 'earlier' | 'later';
}) {
  const movableColumnIds = selectedColumnIds.filter((id) => availableColumnIds.includes(id));
  const currentIndex = movableColumnIds.indexOf(columnId);
  const targetIndex = currentIndex + (direction === 'earlier' ? -1 : 1);

  if (currentIndex === -1 || targetIndex < 0 || targetIndex >= movableColumnIds.length) {
    return selectedColumnIds;
  }

  const sourceIndex = selectedColumnIds.indexOf(columnId);
  const destinationIndex = selectedColumnIds.indexOf(movableColumnIds[targetIndex]!);
  const reorderedIds = [...selectedColumnIds];
  [reorderedIds[sourceIndex], reorderedIds[destinationIndex]] = [
    reorderedIds[destinationIndex]!,
    reorderedIds[sourceIndex]!,
  ];

  return reorderedIds;
}

export function getSelectedDocumentColumns<T extends { id: string }>({
  columns,
  selectedColumnIds,
}: {
  columns: T[];
  selectedColumnIds: string[];
}) {
  const columnsById = new Map(columns.map((column) => [column.id, column]));

  return selectedColumnIds.flatMap((columnId) => {
    const column = columnsById.get(columnId);
    return column ? [column] : [];
  });
}

export function getDocumentColumnsForPicker<T extends { id: string }>({
  columns,
  selectedColumnIds,
}: {
  columns: T[];
  selectedColumnIds: string[];
}) {
  const selectedColumns = getSelectedDocumentColumns({ columns, selectedColumnIds });
  const selectedIds = new Set(selectedColumns.map(({ id }) => id));
  const unselectedColumns = columns.filter(({ id }) => !selectedIds.has(id));

  return [...selectedColumns, ...unselectedColumns];
}

export function getCustomPropertyDocumentColumnId({
  propertyDefinitionId,
}: {
  propertyDefinitionId: string;
}) {
  return `customProperty:${propertyDefinitionId}`;
}

export function formatDocumentCustomPropertyValue({
  definition,
  customProperties,
  formatDate,
  booleanLabels,
}: {
  definition: Pick<CustomPropertyDefinition, 'id' | 'type'>;
  customProperties?: Pick<DocumentCustomProperty, 'propertyDefinitionId' | 'value'>[];
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  booleanLabels: {
    true: string;
    false: string;
  };
}): string | null {
  const value = customProperties?.find(
    ({ propertyDefinitionId }) => propertyDefinitionId === definition.id,
  )?.value;

  if (value === null || value === undefined) {
    return null;
  }

  switch (definition.type) {
    case 'text':
      return typeof value === 'string' && value.length > 0 ? value : null;
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) ? String(value) : null;
    case 'date': {
      if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
        return null;
      }

      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : formatDate(date, { dateStyle: 'medium' });
    }
    case 'boolean':
      return typeof value === 'boolean' ? (value ? booleanLabels.true : booleanLabels.false) : null;
    case 'select':
      return rawPropertyValueAsOption(value)?.name ?? null;
    case 'multi_select': {
      const options = rawPropertyValueAsOptionArray(value);
      return options.length > 0 ? options.map(({ name }) => name).join(', ') : null;
    }
    case 'user_relation': {
      const users = rawPropertyValueAsUserArray(value);
      return users.length > 0
        ? users.map(({ name, email }) => name?.trim() || email).join(', ')
        : null;
    }
    case 'document_relation': {
      const documents = rawPropertyValueAsRelatedDocumentArray(value);
      return documents.length > 0 ? documents.map(({ name }) => name).join(', ') : null;
    }
  }
}
