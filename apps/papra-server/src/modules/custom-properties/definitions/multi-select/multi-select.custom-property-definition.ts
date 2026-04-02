import z from 'zod';
import { customPropertySelectOptionIdSchema } from '../../options/custom-properties-options.schemas';
import { ensureOptionsExist } from '../../options/custom-properties-options.usecases';
import { defineCustomPropertyType } from '../custom-property-definition.models';
import { selectCustomPropertyOptionNameSchema } from '../select/select.custom-property-definition.schemas';

export const multiSelectCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'multi_select',

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

    inputSchema: z.array(customPropertySelectOptionIdSchema),

    extendInputValidation: async ({ value, customProperty, customPropertiesOptionsRepository }) => {
      await ensureOptionsExist({
        propertyDefinitionId: customProperty.id,
        optionIds: value,
        customPropertiesOptionsRepository,
      });
    },

    toDb: ({ value }) => value.map(selectOptionId => ({ selectOptionId })),

    fromDb: ({ rows }) => rows
      .filter(r => r.option !== null)
      .map(r => ({
        optionId: r.option!.id,
        name: r.option!.name,
      })),
  },
});
