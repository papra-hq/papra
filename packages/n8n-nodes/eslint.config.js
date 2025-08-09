import antfu from '@antfu/eslint-config';

export default antfu({
  stylistic: {
    semi: true,
  },

  // TODO: include the n8n rules package when it's eslint-9 ready
  // https://github.com/ivov/eslint-plugin-n8n-nodes-base/issues/196

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
