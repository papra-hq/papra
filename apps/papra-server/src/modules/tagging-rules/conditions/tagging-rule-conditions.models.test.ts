import { describe, expect, test } from 'vitest';
import { equalTaggingRuleCondition } from './tagging-rule-conditions.models';

describe('equal tagging-rule-condition', () => {
  describe('equalTaggingRuleCondition', () => {
    const { validate, operator } = equalTaggingRuleCondition;

    test('the operator is equal', () => {
      expect(operator).to.equal('equal');
    });

    test('the condition is valid is the field value is strictly equal to the condition value', () => {
      expect(validate({ conditionValue: 'test', fieldValue: 'test', isCaseSensitive: true })).to.equal(true);
      expect(validate({ conditionValue: 'test', fieldValue: 'testa', isCaseSensitive: true })).to.equal(false);
      expect(validate({ conditionValue: 'test', fieldValue: 'testa', isCaseSensitive: false })).to.equal(false);
      expect(validate({ conditionValue: 'test', fieldValue: 'test', isCaseSensitive: false })).to.equal(true);
      expect(validate({ conditionValue: 'test', fieldValue: 'TEST', isCaseSensitive: false })).to.equal(true);
      expect(validate({ conditionValue: 'test', fieldValue: 'TEST', isCaseSensitive: true })).to.equal(false);
    });
  });
});
