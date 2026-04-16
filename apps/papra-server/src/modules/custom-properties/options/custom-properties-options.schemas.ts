import * as v from 'valibot';
import { createRegexSchema } from '../../shared/schemas/string.schemas';
import { CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX } from './custom-properties-options.constants';

export const customPropertySelectOptionIdSchema = createRegexSchema(CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX);
export const selectCustomPropertyOptionNameSchema = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(255));
