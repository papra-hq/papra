import { z } from 'zod';
import { tagIdRegex } from './tags.constants';

export const tagIdSchema = z.string().regex(tagIdRegex);
