import type { Expand } from '@corentinth/chisels';
import type { ColumnType } from 'kysely';

export type IdColumn = ColumnType<string, string, never>;

export type CreatedAtColumn = {
  created_at: number;
};

export type UpdatedAtColumn = {
  updated_at: number;
};

export type WithTimestamps<T> = T & CreatedAtColumn & UpdatedAtColumn;

export type TableWithIdAndTimestamps<T> = Expand<{
  id: IdColumn;
} & WithTimestamps<T>>;

export type TimestampsToDate<T> = Omit<T, 'created_at' | 'updated_at'> & {
  createdAt: Date;
  updatedAt: Date;
};

// Utility type to recursively convert snake_case to camelCase
type SnakeToCamelCase<S extends string> = S extends `${infer First}_${infer Rest}`
  ? `${First}${Capitalize<SnakeToCamelCase<Rest>>}`
  : S;

// Utility type to convert snake_case keys to camelCase of root level only
export type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamelCase<K> : K]: T[K];
};

export type BusinessInsertable<T, Extras extends Record<string, unknown> = Record<string, never>> = Expand<Omit<CamelCaseKeys<T>, 'id' | 'createdAt' | 'updatedAt' | keyof Extras> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
} & Extras>;
