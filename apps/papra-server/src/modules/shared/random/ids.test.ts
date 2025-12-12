import { describe, expect, test } from 'vitest';
import { ID_RANDOM_PART_LENGTH } from '../../app/database/database.constants';
import { createDeterministicIdGenerator, createPrefixedIdRegex, generateId } from './ids';

describe('database models', () => {
  describe('createPrefixedIdRegex', () => {
    test('build a regex for prefixed id validation', () => {
      const regex = createPrefixedIdRegex({ prefix: 'tag' });

      expect(regex.toString()).to.eql('/^tag_[a-z0-9]{24}$/');
    });
  });

  describe('createDeterministicIdGenerator', () => {
    describe('provide a id generator that increments ids deterministically, mainly used for testing', () => {
      test('the id generator produces sequential ids with the given prefix', () => {
        const generateId = createDeterministicIdGenerator({ prefix: 'item' });

        expect(generateId()).to.eql('item_000000000000000000000001');
        expect(generateId()).to.eql('item_000000000000000000000002');
        expect(generateId()).to.eql('item_000000000000000000000003');
      });

      test('the prefix is optional', () => {
        const generateId = createDeterministicIdGenerator();

        expect(generateId()).to.eql('000000000000000000000001');
        expect(generateId()).to.eql('000000000000000000000002');
      });

      test('the generated ids have the same length as production database ids', () => {
        const generateDeterministicId = createDeterministicIdGenerator();

        expect(generateDeterministicId().length).to.eql(ID_RANDOM_PART_LENGTH);
        expect(generateDeterministicId().length).to.eql(generateId().length);

        const generateDeterministicIdWithPrefix = createDeterministicIdGenerator({ prefix: 'test' });

        expect(generateDeterministicIdWithPrefix().length).to.eql('test_'.length + ID_RANDOM_PART_LENGTH);
        expect(generateDeterministicIdWithPrefix().length).to.eql(generateId({ prefix: 'test' }).length);
      });
    });
  });
});
