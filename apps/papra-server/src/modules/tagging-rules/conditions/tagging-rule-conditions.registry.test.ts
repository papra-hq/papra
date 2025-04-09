import { describe, expect, test } from 'vitest';
import { TAGGING_RULE_OPERATORS } from '../tagging-rules.constants';
import { taggingRuleOperatorDefinitions } from './tagging-rule-conditions.registry';

describe('tagging-rule-conditions registry', () => {
  describe('taggingRuleOperatorDefinitions', () => {
    test('all defined allowed operators must have a corresponding tagging rule condition definition', () => {
      const allowedOperators = Object.values(TAGGING_RULE_OPERATORS);

      const missingOperators = allowedOperators.filter(operator => !taggingRuleOperatorDefinitions.some(taggingRuleOperatorDefinition => taggingRuleOperatorDefinition.operator === operator));

      expect(missingOperators).to.deep.equal([], `Missing tagging rule operator definitions for operators: ${missingOperators.map(operator => `"${operator}"`).join(', ')}`);
    });
  });
});
