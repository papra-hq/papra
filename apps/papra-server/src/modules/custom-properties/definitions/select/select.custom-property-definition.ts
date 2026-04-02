import z from 'zod';
import { customPropertySelectOptionIdSchema } from '../../options/custom-properties-options.schemas';
import { ensureOptionExists } from '../../options/custom-properties-options.usecases';
import { defineCustomPropertyType } from '../custom-property-definition.models';
import { selectCustomPropertyOptionNameSchema } from './select.custom-property-definition.schemas';

export const selectCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'select',

  definition: {
    createExtraSchema: z.object({
      options: z
        .array(z.object({
          name: selectCustomPropertyOptionNameSchema,
        }))
        .min(1, 'At least one option must be provided'),
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

    updateExtraSchema: z.object({
      options: z.array(z.object({
        id: customPropertySelectOptionIdSchema.optional(),
        name: selectCustomPropertyOptionNameSchema,
      })).min(1, 'At least one option must be provided').optional(),
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
