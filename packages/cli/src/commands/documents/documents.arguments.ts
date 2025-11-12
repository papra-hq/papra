export const organizationIdArgument = {
  type: 'string',
  description: 'The organization ID. If not set, and you belong to multiple organizations, you\'ll be prompted to choose one.',
  alias: 'o',
  valueHint: 'organization-id',
} as const;
