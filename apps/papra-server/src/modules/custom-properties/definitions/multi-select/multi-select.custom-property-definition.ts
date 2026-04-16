import * as v from 'valibot';
import { customPropertySelectOptionIdSchema, selectCustomPropertyOptionNameSchema } from '../../options/custom-properties-options.schemas';
import { ensureOptionsExist } from '../../options/custom-properties-options.usecases';
import { defineCustomPropertyType } from '../custom-property-definition.models';

export const multiSelectCustomPropertyDefinition = defineCustomPropertyType({
  typeName: 'multi_select',

  definition: {
    createExtraSchema: v.object({
      options: v.pipe(
        v.array(v.object({
          name: selectCustomPropertyOptionNameSchema,
        })),
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

    inputSchema: v.array(customPropertySelectOptionIdSchema),

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
