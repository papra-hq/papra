import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
  },
  rules: {
    'typescript/consistent-type-imports': 'error',
    'no-console': 'error',
    'no-unused-vars': 'error',
    'typescript/no-redundant-type-constituents': 'error',
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
