import * as v from 'valibot';
import { customPropertySelectOptionIdSchema, selectCustomPropertyOptionNameSchema } from '../../options/custom-properties-options.schemas';
import { ensureOptionExists } from '../../options/custom-properties-options.usecases';
import { defineCustomPropertyType } from '../custom-property-definition.models';

export const selectCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'select',

  definition: {
    createExtraSchema: v.object({
      options: v.pipe(
        v.array(v.object({ name: selectCustomPropertyOptionNameSchema })),
        v.minLength(1, 'At least one option must be provided'),
      ),
    }),

    onCreate: async ({
      apiInput: { options },
      propertyDefinition,
      customPropertiesOptionsRepository,
    }) => {
      await customPropertiesOptionsRepository.syncSelectOptions({
        propertyDefinitionId: propertyDefinition.id,
        options,
      });
    },

    updateExtraSchema: v.object({
      options: v.optional(v.pipe(
        v.array(v.object({
          id: v.optional(customPropertySelectOptionIdSchema),
          name: selectCustomPropertyOptionNameSchema,
        })),
        v.minLength(1, 'At least one option must be provided'),
      )),
    }),

    onUpdate: async ({
      apiInput: { options },
      propertyDefinition,
      customPropertiesOptionsRepository,
    }) => {
      if (options) {
        await customPropertiesOptionsRepository.syncSelectOptions({
          propertyDefinitionId: propertyDefinition.id,
          options,
        });
      }
    },
  },

  value: {

    inputSchema: customPropertySelectOptionIdSchema,

    extendInputValidation: async ({ value, customProperty, customPropertiesOptionsRepository }) => {
      await ensureOptionExists({
        optionId: value,
        propertyDefinitionId: customProperty.id,
        customPropertiesOptionsRepository,
      });
    },

    toDb: ({ value }) => ({ selectOptionId: value }),

    fromDb: ({ rows }) => {
      const row = rows[0];

      if (!row?.option) {
        return null;
      }

      return ({
        optionId: row.option.id,
        name: row.option.name,
      });
    },
  },
});
