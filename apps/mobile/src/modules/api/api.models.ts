type DateKeys = 'createdAt' | 'updatedAt' | 'deletedAt' | 'expiresAt' | 'lastTriggeredAt' | 'lastUsedAt' | 'scheduledPurgeAt';

export type CoerceDate<T> = T extends string | Date
  ? Date
  : T extends string | Date | null | undefined
    ? Date | undefined
    : T;

export type CoerceDates<T> = {
  [K in keyof T]: K extends DateKeys ? CoerceDate<T[K]> : T[K];
};

export function coerceDate(date: unknown): Date {
  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'string' || typeof date === 'number') {
    return new Date(date);
  }

  throw new Error(`Invalid date: expected Date, string, or number, but received value "${String(date)}" of type "${typeof date}"`);
}

export function coerceDateOrUndefined(date: unknown): Date | undefined {
  if (date == null) {
    return undefined;
  }
  return coerceDate(date);
}

export function coerceDates<T extends Record<string, unknown>>(obj: T): CoerceDates<T> {
  return {
    ...obj,
    ...('createdAt' in obj ? { createdAt: coerceDateOrUndefined(obj.createdAt) } : {}),
    ...('updatedAt' in obj ? { updatedAt: coerceDateOrUndefined(obj.updatedAt) } : {}),
    ...('deletedAt' in obj ? { deletedAt: coerceDateOrUndefined(obj.deletedAt) } : {}),
    ...('expiresAt' in obj ? { expiresAt: coerceDateOrUndefined(obj.expiresAt) } : {}),
    ...('lastTriggeredAt' in obj ? { lastTriggeredAt: coerceDateOrUndefined(obj.lastTriggeredAt) } : {}),
    ...('lastUsedAt' in obj ? { lastUsedAt: coerceDateOrUndefined(obj.lastUsedAt) } : {}),
    ...('scheduledPurgeAt' in obj ? { scheduledPurgeAt: coerceDateOrUndefined(obj.scheduledPurgeAt) } : {}),
  } as CoerceDates<T>;
}

export type LocalDocument = {
  uri: string;
  name: string;
  type: string | undefined;
};
