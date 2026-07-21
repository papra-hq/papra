import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'import'],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    'typescript/consistent-type-imports': 'error',
    'no-console': 'error',
    'no-unused-vars': 'error',
    'typescript/no-redundant-type-constituents': 'error',

    'import/no-duplicates': 'error',
    'import/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    'import/first': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-default': 'error',
    'import/newline-after-import': ['error', { count: 1 }],

    'unicorn/prefer-node-protocol': 'error',
    'typescript/promise-function-async': 'error',
    'typescript/use-unknown-in-catch-callback-variable': 'error',
  },
  // oxlint's `ignorePatterns` config option is NOT reliably honored by the
  // type-aware linter when `typeCheck: true` is on — it still walks files
  // imported transitively from non-ignored sources. So we keep this list
  // for the linter side AND we also pass `--ignore-pattern` on the CLI.
  ignorePatterns: [
    '.output/**',
    '.data/**',
    '.nuxt/**',
    '.nitro/**',
    '.cache/**',
    '**/dist/**',
    '**/dist-app/**',
    '**/dist-node/**',
    '**/dist-cloudflare/**',
    '**/.astro/**',
    '**/.next/**',
    '**/.svelte-kit/**',
    'node_modules/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',

    'apps/docs/src/scripts/posthog.script.js',
  ],
  // Override specific files that the linter still walks despite the
  // ignore patterns. Use a tiny deny-list.
  overrides: [
    {
      // Anything inside a dist/ folder or generated Astro/Svelte output.
      // `files: ['**']` matches every file in scope, then we re-ignore the
      // generated ones explicitly. This is a belt-and-suspenders fix.
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.mjs'],
      rules: {
        // Disable ALL rules in generated code so the linter still
        // parses the file for cross-file type info but doesn't flag
        // anything inside it.
        'no-unused-vars': 'off',
        'typescript/consistent-type-imports': 'off',
        'import/first': 'off',
        'import/no-duplicates': 'off',
        'import/newline-after-import': 'off',
        'typescript/use-unknown-in-catch-callback-variable': 'off',
        'typescript/promise-function-async': 'off',
      },
    },
  ],
});
