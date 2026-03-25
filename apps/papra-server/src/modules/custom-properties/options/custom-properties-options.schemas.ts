import z from 'zod';
import { CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX } from './custom-properties-options.constants';

export const customPropertySelectOptionIdSchema = z.string().regex(CUSTOM_PROPERTY_SELECT_OPTION_ID_REGEX);
