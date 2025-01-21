import { isUndefined, omitBy } from 'lodash-es';

type OmitUndefined<T> = {
  [K in keyof T]: Exclude<T[K], undefined>;
};

export function omitUndefined<T extends Record<string, any>>(obj: T): OmitUndefined<T> {
  return omitBy(obj, isUndefined) as OmitUndefined<T>;
}
