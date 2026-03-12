import type { CustomPropertyType } from './custom-properties.constants';
import { z } from 'zod';
import { TagColorRegex } from '../tags/tags.constants';
import {
  CUSTOM_PROPERTY_DEFINITION_ID_REGEX,
  CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX,
  CUSTOM_PROPERTY_TYPES_LIST,
} from './custom-properties.constants';

export const customPropertyDefinitionIdSchema = z.string().regex(CUSTOM_PROPERTY_DEFINITION_ID_REGEX);
export const customPropertySelectOptionIdSchema = z.string().regex(CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX);

const selectOptionSchema = z.object({
  value: z.string().trim().min(1).max(256),
  color: z.string().toUpperCase().regex(TagColorRegex, 'Invalid color format, must be a hex color code like #000000').optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
});

export const createCustomPropertyDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).optional().nullable(),
  type: z.enum(CUSTOM_PROPERTY_TYPES_LIST as [CustomPropertyType, ...CustomPropertyType[]]),
  color: z.string().toUpperCase().regex(TagColorRegex, 'Invalid color format, must be a hex color code like #000000').optional().nullable(),
  isRequired: z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional().default(0),
  options: z.array(selectOptionSchema).optional(),
});

export const updateCustomPropertyDefinitionSchema = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  description: z.string().trim().max(512).optional().nullable(),
  color: z.string().toUpperCase().regex(TagColorRegex, 'Invalid color format, must be a hex color code like #000000').optional().nullable(),
  isRequired: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
  options: z.array(selectOptionSchema.extend({
    id: customPropertySelectOptionIdSchema.optional(),
  })).optional(),
});

export const setPropertyValueSchema = z.object({
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]),
});
