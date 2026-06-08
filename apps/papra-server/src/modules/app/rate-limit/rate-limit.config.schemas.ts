import * as v from 'valibot';
import { parseRateLimitConfig } from './rate-limit.config.models';

export const rateLimitConfigSchema = v.pipe(v.string(), v.transform(parseRateLimitConfig));
