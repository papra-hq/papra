import z from 'zod';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const booleanCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'boolean',

  value: {

    inputSchema: z.boolean(),

    toDb: ({ value }) => ({ booleanValue: value }),

    fromDb: ensureRow(({ row }) => row.value.booleanValue),
  },
});
