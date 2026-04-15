import { z } from 'zod';
import { CUSTOM_PROPERTY_DEFINITION_ID_REGEX, CUSTOM_PROPERTY_TYPES_LIST } from './custom-properties.constants';

export const customPropertyDefinitionIdSchema = z.string().regex(CUSTOM_PROPERTY_DEFINITION_ID_REGEX);
export const customPropertyTypeSchema = z.enum(CUSTOM_PROPERTY_TYPES_LIST as [string, ...string[]]);
