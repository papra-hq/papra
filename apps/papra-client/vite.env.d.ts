declare module '*.yml?flattened' {
  import type { LocaleKeys } from './types'; // Adjust the import path as needed

  const value: Record<LocaleKeys, string>;
  export default value;
}
