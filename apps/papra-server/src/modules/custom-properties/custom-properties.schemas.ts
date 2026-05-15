import { createRegexSchema } from '../shared/schemas/string.schemas';
import { CUSTOM_PROPERTY_DEFINITION_ID_REGEX } from './custom-properties.constants';

export const customPropertyDefinitionIdSchema = createRegexSchema(CUSTOM_PROPERTY_DEFINITION_ID_REGEX);
