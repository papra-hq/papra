import { z } from 'zod';
import { TAGGING_RULE_ID_REGEX } from './tagging-rules.constants';

export const taggingRuleIdSchema = z.string().regex(TAGGING_RULE_ID_REGEX);
