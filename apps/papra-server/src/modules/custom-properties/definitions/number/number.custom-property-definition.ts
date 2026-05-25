import * as v from 'valibot';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const numberCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'number',

  value: {
    inputSchema: v.pipe(v.number(), v.finite()),

    toDb: ({ value }) => ({ numberValue: value }),

    fromDb: ensureRow(({ row }) => row.value.numberValue),
  },
});
