import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: {
    tsconfigPath: './tsconfig.json',
    overridesTypeAware: {
      'ts/no-misused-promises': ['error', { checksVoidReturn: false }],
      'ts/strict-boolean-expressions': ['error', { allowNullableObject: true }],
    },

  },
  stylistic: {
    semi: true,
  },

  rules: {
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
