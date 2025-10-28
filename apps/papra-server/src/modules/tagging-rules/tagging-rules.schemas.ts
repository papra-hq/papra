import { z } from 'zod';
import { CONDITION_MATCH_MODES, TAGGING_RULE_ID_REGEX } from './tagging-rules.constants';

export const taggingRuleIdSchema = z.string().regex(TAGGING_RULE_ID_REGEX);

export const conditionMatchModeSchema = z.enum([CONDITION_MATCH_MODES.ALL, CONDITION_MATCH_MODES.ANY]);
