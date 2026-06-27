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
  },
  ignorePatterns: [
    '.output/**',
    '.data/**',
    '.nuxt/**',
    '.nitro/**',
    '.cache/**',
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',

    'apps/docs/src/scripts/posthog.script.js',
  ],
});
