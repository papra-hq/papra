import antfu from '@antfu/eslint-config';

export default antfu({
  stylistic: {
    semi: true,
  },

  solid: true,

  ignores: [
    'public/manifest.json',
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
}, {
  files: ['src/locales/*.dictionary.ts'],
  rules: {
    // Sometimes for formatting amounts of dollar, we need "${{value}}" as value is interpolated later, it's not a template string here
    'no-template-curly-in-string': 'off',
  },
});
