import * as v from 'valibot';
import { createRegexSchema } from '../shared/schemas/string.schemas';
import { tagIdSchema } from '../tags/tags.schemas';
import { CONDITION_MATCH_MODES, TAGGING_RULE_FIELDS, TAGGING_RULE_ID_REGEX, TAGGING_RULE_OPERATORS } from './tagging-rules.constants';

export const taggingRuleIdSchema = createRegexSchema(TAGGING_RULE_ID_REGEX);

const conditionMatchModeSchema = v.picklist([CONDITION_MATCH_MODES.ALL, CONDITION_MATCH_MODES.ANY]);

const taggingRuleConditionSchema = v.strictObject({
  field: v.picklist(Object.values(TAGGING_RULE_FIELDS)),
  operator: v.picklist(Object.values(TAGGING_RULE_OPERATORS)),
  value: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
});

export const taggingRuleBodySchema = v.strictObject({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
  description: v.optional(v.pipe(v.string(), v.maxLength(256))),
  enabled: v.optional(v.boolean()),
  conditionMatchMode: v.optional(conditionMatchModeSchema),
  conditions: v.pipe(v.array(taggingRuleConditionSchema), v.maxLength(10)), // Conditions can be empty
  tagIds: v.pipe(v.array(tagIdSchema), v.minLength(1)),
});
