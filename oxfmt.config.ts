import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  semi: true,
  trailingComma: 'all',
  printWidth: 100,
  sortPackageJson: true,
  arrowParens: 'always',
  insertFinalNewline: true,
  objectWrap: 'preserve',
  tabWidth: 2,
  useTabs: false,
  quoteProps: 'consistent',
  ignorePatterns: [
    // MDX with markdown inside JSX component children gets mangled by the formatter
    // (the markdown/JSX boundary is ambiguous and indentation-sensitive). Plain .md is fine.
    '**/*.mdx',
    'apps/docs/src/scripts/posthog.script.js',
    // Minified/bundled build artifact checked in for migration testing —
    // not source, shouldn't be pretty-printed.
    'test-dist-scripts/**',
  ],
});
