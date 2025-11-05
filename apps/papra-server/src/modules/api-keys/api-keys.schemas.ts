import type { ApiKeyPermissions } from './api-keys.types';
import { z } from 'zod';
import { API_KEY_ID_REGEX, API_KEY_PERMISSIONS_VALUES } from './api-keys.constants';

export const apiKeyIdSchema = z.string().regex(API_KEY_ID_REGEX);

export const apiPermissionsSchema = z.array(z.enum(API_KEY_PERMISSIONS_VALUES as [ApiKeyPermissions, ...ApiKeyPermissions[]]));
