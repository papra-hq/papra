import * as v from 'valibot';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const dateCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'date',

  value: {
    inputSchema: v.pipe(
      v.union([v.string(), v.number()]),
      v.toDate(),
    ),

    toDb: ({ value }) => ({ dateValue: value }),

    fromDb: ensureRow(({ row }) => row.value.dateValue),
  },
});
