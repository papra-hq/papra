import type { ConfigDefinition } from 'figue';
import { coercedStrictlyPositiveIntegerSchema } from '../shared/schemas/number.schemas';

export const tagsConfig = {
  maxTagsPerOrganization: {
    doc: 'The maximum number of tags an organization can have',
    schema: coercedStrictlyPositiveIntegerSchema,
    default: 200,
    env: 'MAX_TAGS_PER_ORGANIZATION',
  },
} as const satisfies ConfigDefinition;
