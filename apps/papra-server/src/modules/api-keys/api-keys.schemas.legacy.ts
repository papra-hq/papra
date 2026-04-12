import { z } from 'zod';
import { API_KEY_ID_REGEX } from './api-keys.constants';

export const apiKeyIdSchema = z.string().regex(API_KEY_ID_REGEX);
