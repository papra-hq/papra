import antfu from '@antfu/eslint-config';

export default antfu({
  astro: true,

  stylistic: {
    semi: true,
  },

  ignores: [
    'src/components/PosthogAnalytics.astro', // Inlined script
    'src/components/ContactForm.astro', // Inlined script
  ],

  rules: {
    'pnpm/json-enforce-catalog': 'off',
    // To allow export on top of files
    'ts/no-use-before-define': ['error', { allowNamedExports: true, functions: false }],
    'curly': ['error', 'all'],
    'vitest/consistent-test-it': ['error', { fn: 'test' }],
    'ts/consistent-type-definitions': ['error', 'type'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: false }],
    'unused-imports/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
  },
});
