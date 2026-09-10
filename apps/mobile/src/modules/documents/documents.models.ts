import type { DocumentCustomProperty } from './documents.types';

function formatSelectOption(value: unknown): string {
  if (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof value.name === 'string'
  ) {
    return value.name;
  }

  return '';
}

export function formatCustomPropertyValue(
  { type, value }: DocumentCustomProperty,
  { formatDate }: { formatDate: (date: Date) => string },
): string {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return '—';
  }

  if (type === 'select' && typeof value === 'object') {
    return formatSelectOption(value) || '—';
  }

  if (type === 'multi_select' && Array.isArray(value)) {
    return value.map(formatSelectOption).filter(Boolean).join(', ') || '—';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (Array.isArray(value)) {
    return value
      .filter((item) => typeof item === 'string' || typeof item === 'number')
      .map(String)
      .join(', ');
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (type === 'date') {
      const date = new Date(value);
      if (!Number.isNaN(date.getTime())) {
        return formatDate(date);
      }
    }

    return value;
  }

  return JSON.stringify(value);
}
