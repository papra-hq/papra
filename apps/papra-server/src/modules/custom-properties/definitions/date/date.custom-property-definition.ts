import z from 'zod';
import { isValidDate } from '../../../shared/date';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

const dateInputSchema = z.union([z.string(), z.number()]).transform((value) => {
  const date = new Date(value);

  if (!isValidDate(date)) {
    throw new Error('Invalid date value');
  }

  return date;
});

export const dateCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'date',

  value: {

    inputSchema: dateInputSchema,

    toDb: ({ value }) => ({ dateValue: value }),

    fromDb: ensureRow(({ row }) => row.value.dateValue),
  },
});
