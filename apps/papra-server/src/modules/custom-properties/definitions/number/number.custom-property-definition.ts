import z from 'zod';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const numberCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'number',

  value: {
    inputSchema: z.number().finite(),

    toDb: ({ value }) => ({ numberValue: value }),

    fromDb: ensureRow(({ row }) => row.value.numberValue),
  },
});
