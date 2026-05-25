export function rawPropertyValueAsOption(value: unknown): { optionId: string; name: string } | null {
  if (
    typeof value === 'object'
    && value !== null
    && 'optionId' in value
    && typeof value.optionId === 'string'
    && 'name' in value
    && typeof value.name === 'string'
  ) {
    return { optionId: value.optionId, name: value.name };
  }
  return null;
}

export function rawPropertyValueAsOptionArray(value: unknown): { optionId: string; name: string }[] {
  if (Array.isArray(value)) {
    return value.map(rawPropertyValueAsOption).filter(v => v !== null);
  }
  return [];
}

export function rawPropertyValueAsUserArray(value: unknown): { userId: string; name: string | null; email: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (v): v is { userId: string; name: string | null; email: string } =>
      typeof v === 'object'
      && v !== null
      && 'userId' in v
      && typeof v.userId === 'string'
      && 'email' in v
      && typeof v.email === 'string',
  );
}

export function rawPropertyValueAsRelatedDocumentArray(value: unknown): { documentId: string; name: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (v): v is { documentId: string; name: string } =>
      typeof v === 'object'
      && v !== null
      && 'documentId' in v
      && typeof v.documentId === 'string'
      && 'name' in v
      && typeof v.name === 'string',
  );
}
