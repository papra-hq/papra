import z from 'zod';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const textCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'text',

  value: {

    inputSchema: z.string().max(10_000, 'Text custom property value must be at most 10,000 characters long'),

    toDb: ({ value }) => ({ textValue: value }),

    fromDb: ensureRow(({ row }) => row.value.textValue),
  },
});
