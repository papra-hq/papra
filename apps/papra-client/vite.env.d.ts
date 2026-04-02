declare module '*.yml' {
  import type { LocaleKeys } from './types'; // Adjust the import path as needed

  const value: Record<LocaleKeys, string>;
  export default value;
}
declare const __PDFJS_VERSION__: string;
