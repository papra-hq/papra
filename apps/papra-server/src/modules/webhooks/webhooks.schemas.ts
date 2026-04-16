import { EVENT_NAMES } from '@papra/webhooks';
import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { WEBHOOK_ID_REGEX } from './webhooks.constants';

export const webhookIdSchema = createRegexSchema(WEBHOOK_ID_REGEX);
export const webhookEventSchema = v.picklist(EVENT_NAMES);
export const webhookEventListSchema = v.pipe(v.array(webhookEventSchema), v.minLength(1));
export const webhookSecretSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(256));
export const webhookNameSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(128));
export const webhookUrlSchema = v.pipe(v.string(), v.url(), v.maxLength(2048));
