import { z } from 'zod';
import { viewIdRegex } from './views.constants';

export const viewIdSchema = z.string().regex(viewIdRegex);
