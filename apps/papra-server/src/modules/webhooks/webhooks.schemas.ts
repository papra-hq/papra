import { EVENT_NAMES } from '@papra/webhooks';
import { z } from 'zod';
import { WEBHOOK_ID_REGEX } from './webhooks.constants';

export const webhookIdSchema = z.string().regex(WEBHOOK_ID_REGEX);
export const webhookEventSchema = z.enum(EVENT_NAMES);
export const webhookEventListSchema = z.array(webhookEventSchema).min(1);
export const webhookSecretSchema = z.string().min(1).max(256);
export const webhookNameSchema = z.string().min(1).max(128);
export const webhookUrlSchema = z.string().url().max(2048);
