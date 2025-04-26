export function getFormData(pojo: Record<string, string | Blob>): FormData {
  const formData = new FormData();
  Object.entries(pojo).forEach(([key, value]) => formData.append(key, value));
  return formData;
}

type DateKeys = 'createdAt' | 'updatedAt' | 'deletedAt';

type CoerceDate<T> = T extends string | Date
  ? Date
  : T extends string | Date | null | undefined
    ? Date | undefined
    : T;

type CoerceDates<T> = {
  [K in keyof T]: K extends DateKeys ? CoerceDate<T[K]> : T[K];
};

export function coerceDates<T extends Record<string, any>>(obj: T): CoerceDates<T> {
  const toDate = (value: string | Date | null | undefined) => value ? new Date(value) : undefined;

  return {
    ...obj,
    ...('createdAt' in obj ? { createdAt: toDate(obj.createdAt) } : {}),
    ...('updatedAt' in obj ? { updatedAt: toDate(obj.updatedAt) } : {}),
    ...('deletedAt' in obj ? { deletedAt: toDate(obj.deletedAt) } : {}),
    ...('expiresAt' in obj ? { expiresAt: toDate(obj.expiresAt) } : {}),
    ...('lastUsedAt' in obj ? { lastUsedAt: toDate(obj.lastUsedAt) } : {}),
  };
}
