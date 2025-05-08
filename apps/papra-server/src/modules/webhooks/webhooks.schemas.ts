import { EVENT_NAMES } from '@papra/webhooks';
import { z } from 'zod';

export const webhookEventSchema = z.enum(EVENT_NAMES);
export const webhookEventListSchema = z.array(webhookEventSchema);
