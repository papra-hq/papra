import * as v from 'valibot';
import { defineCustomPropertyType, ensureRow } from '../custom-property-definition.models';

export const booleanCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'boolean',

  value: {

    inputSchema: v.boolean(),

    toDb: ({ value }) => ({ booleanValue: value }),

    fromDb: ensureRow(({ row }) => row.value.booleanValue),
  },
});
