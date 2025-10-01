import { z } from 'zod';
import { TagColorRegex, tagIdRegex } from './tags.constants';

export const tagIdSchema = z.string().regex(tagIdRegex);
export const tagColorSchema = z.string().toUpperCase().regex(TagColorRegex, 'Invalid Color format, must be a hex color code like #000000');
