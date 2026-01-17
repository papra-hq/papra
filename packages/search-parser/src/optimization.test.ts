import type { Expression } from './parser.types';
import { describe, expect, test } from 'vitest';
import { areExpressionsIdentical, simplifyExpression } from './optimization';

describe('simplifyExpression', () => {
  describe('when handling leaf nodes', () => {
    test('returns empty expression unchanged', () => {
      const expression: Expression = { type: 'empty' };
      expect(simplifyExpression({ expression })).toEqual({ expression });
    });

    test('returns text expression unchanged', () => {
      const expression: Expression = { type: 'text', value: 'hello' };
      expect(simplifyExpression({ expression })).toEqual({ expression });
    });

    test('returns filter expression unchanged', () => {
      const expression: Expression = {
        type: 'filter',
        field: 'tag',
        operator: '=',
        value: 'invoice',
      };
      expect(simplifyExpression({ expression })).toEqual({ expression });
    });
  });

  describe('when simplifying single-child AND/OR expressions', () => {
    test('simplifies AND with single child to that child', () => {
      const expression: Expression = {
        type: 'and',
        operands: [{ type: 'text', value: 'hello' }],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'text', value: 'hello' },
      });
    });

    test('simplifies OR with single child to that child', () => {
      const expression: Expression = {
        type: 'or',
        operands: [{ type: 'filter', field: 'tag', operator: '=', value: 'invoice' }],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
      });
    });

    test('simplifies nested single-child expressions', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          {
            type: 'or',
            operands: [{ type: 'text', value: 'hello' }],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'text', value: 'hello' },
      });
    });
  });

  describe('when eliminating double negation', () => {
    test('simplifies NOT(NOT(A)) to A', () => {
      const expression: Expression = {
        type: 'not',
        operand: {
          type: 'not',
          operand: { type: 'text', value: 'hello' },
        },
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'text', value: 'hello' },
      });
    });

    test('simplifies NOT(NOT(NOT(NOT(A)))) to A', () => {
      const expression: Expression = {
        type: 'not',
        operand: {
          type: 'not',
          operand: {
            type: 'not',
            operand: {
              type: 'not',
              operand: { type: 'text', value: 'hello' },
            },
          },
        },
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'text', value: 'hello' },
      });
    });

    test('simplifies NOT(NOT(NOT(A))) to NOT(A)', () => {
      const expression: Expression = {
        type: 'not',
        operand: {
          type: 'not',
          operand: {
            type: 'not',
            operand: { type: 'text', value: 'hello' },
          },
        },
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'not',
          operand: { type: 'text', value: 'hello' },
        },
      });
    });
  });

  describe('when flattening nested AND/OR expressions', () => {
    test('flattens nested AND expressions', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'b' },
              { type: 'text', value: 'c' },
            ],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
            { type: 'text', value: 'c' },
          ],
        },
      });
    });

    test('flattens nested OR expressions', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          { type: 'text', value: 'a' },
          {
            type: 'or',
            operands: [
              { type: 'text', value: 'b' },
              { type: 'text', value: 'c' },
            ],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
            { type: 'text', value: 'c' },
          ],
        },
      });
    });

    test('flattens deeply nested expressions', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'a' },
              {
                type: 'and',
                operands: [
                  { type: 'text', value: 'b' },
                  { type: 'text', value: 'c' },
                ],
              },
            ],
          },
          { type: 'text', value: 'd' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
            { type: 'text', value: 'c' },
            { type: 'text', value: 'd' },
          ],
        },
      });
    });

    test('does not flatten AND inside OR', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          { type: 'text', value: 'a' },
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'b' },
              { type: 'text', value: 'c' },
            ],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'a' },
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'b' },
                { type: 'text', value: 'c' },
              ],
            },
          ],
        },
      });
    });

    test('does not flatten OR inside AND', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          {
            type: 'or',
            operands: [
              { type: 'text', value: 'b' },
              { type: 'text', value: 'c' },
            ],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            {
              type: 'or',
              operands: [
                { type: 'text', value: 'b' },
                { type: 'text', value: 'c' },
              ],
            },
          ],
        },
      });
    });
  });

  describe('when removing empty expressions', () => {
    test('removes empty from AND operands', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          { type: 'empty' },
          { type: 'text', value: 'b' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
          ],
        },
      });
    });

    test('removes empty from OR operands', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          { type: 'empty' },
          { type: 'text', value: 'a' },
          { type: 'empty' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'text', value: 'a' },
      });
    });

    test('simplifies NOT(empty) to empty', () => {
      const expression: Expression = {
        type: 'not',
        operand: { type: 'empty' },
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'empty' },
      });
    });
  });

  describe('when applying identity laws', () => {
    test('simplifies AND() to empty', () => {
      const expression: Expression = {
        type: 'and',
        operands: [],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'empty' },
      });
    });

    test('simplifies OR() to empty', () => {
      const expression: Expression = {
        type: 'or',
        operands: [],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'empty' },
      });
    });

    test('simplifies AND(empty, empty) to empty', () => {
      const expression: Expression = {
        type: 'and',
        operands: [{ type: 'empty' }, { type: 'empty' }],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: { type: 'empty' },
      });
    });
  });

  describe('when removing duplicates', () => {
    test('removes duplicate text expressions from AND', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'hello' },
          { type: 'text', value: 'world' },
          { type: 'text', value: 'hello' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'hello' },
            { type: 'text', value: 'world' },
          ],
        },
      });
    });

    test('removes duplicate filter expressions from OR', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
          { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' },
          ],
        },
      });
    });

    test('removes duplicate complex nested expressions', () => {
      const duplicateExpr: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          { type: 'text', value: 'b' },
        ],
      };

      const expression: Expression = {
        type: 'or',
        operands: [
          duplicateExpr,
          { type: 'text', value: 'c' },
          duplicateExpr,
        ],
      };

      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
            { type: 'text', value: 'c' },
          ],
        },
      });
    });

    test('respects order when deduplicating - keeps first occurrence', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          { type: 'text', value: 'b' },
          { type: 'text', value: 'a' },
          { type: 'text', value: 'c' },
          { type: 'text', value: 'b' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
            { type: 'text', value: 'c' },
          ],
        },
      });
    });

    test('treats AND(A, B) and AND(B, A) as different (order matters)', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'a' },
              { type: 'text', value: 'b' },
            ],
          },
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'b' },
              { type: 'text', value: 'a' },
            ],
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'b' },
                { type: 'text', value: 'a' },
              ],
            },
          ],
        },
      });
    });
  });

  describe('when combining multiple optimizations', () => {
    test('applies all optimizations in sequence', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'a' },
              { type: 'text', value: 'a' },
            ],
          },
          { type: 'empty' },
          {
            type: 'not',
            operand: {
              type: 'not',
              operand: { type: 'text', value: 'b' },
            },
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
          ],
        },
      });
    });

    test('handles complex nested structure with all optimization types', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'x' },
              {
                type: 'and',
                operands: [
                  { type: 'text', value: 'x' },
                  { type: 'empty' },
                ],
              },
            ],
          },
          {
            type: 'not',
            operand: {
              type: 'not',
              operand: {
                type: 'or',
                operands: [{ type: 'text', value: 'y' }],
              },
            },
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'text', value: 'x' },
            { type: 'text', value: 'y' },
          ],
        },
      });
    });

    test('simplifies all duplicates after flattening', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'text', value: 'a' },
          {
            type: 'and',
            operands: [
              { type: 'text', value: 'a' },
              { type: 'text', value: 'b' },
            ],
          },
          { type: 'text', value: 'b' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'text', value: 'a' },
            { type: 'text', value: 'b' },
          ],
        },
      });
    });
  });

  describe('when handling edge cases', () => {
    test('preserves NOT expressions that cannot be simplified', () => {
      const expression: Expression = {
        type: 'not',
        operand: { type: 'text', value: 'hello' },
      };
      expect(simplifyExpression({ expression })).toEqual({ expression });
    });

    test('handles expressions with different filter operators', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          { type: 'filter', field: 'createdAt', operator: '>', value: '2024-01-01' },
          { type: 'filter', field: 'createdAt', operator: '<', value: '2024-12-31' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({ expression });
    });

    test('treats same field with different operators as different', () => {
      const expression: Expression = {
        type: 'or',
        operands: [
          { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
          { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
          { type: 'filter', field: 'tag', operator: '>', value: 'invoice' },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'or',
          operands: [
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '>', value: 'invoice' },
          ],
        },
      });
    });

    test('handles deeply nested NOT expressions correctly', () => {
      const expression: Expression = {
        type: 'and',
        operands: [
          {
            type: 'not',
            operand: {
              type: 'not',
              operand: {
                type: 'not',
                operand: { type: 'text', value: 'a' },
              },
            },
          },
          {
            type: 'not',
            operand: {
              type: 'not',
              operand: { type: 'text', value: 'b' },
            },
          },
        ],
      };
      expect(simplifyExpression({ expression })).toEqual({
        expression: {
          type: 'and',
          operands: [
            { type: 'not', operand: { type: 'text', value: 'a' } },
            { type: 'text', value: 'b' },
          ],
        },
      });
    });
  });

  describe('expressionsEqual', () => {
    describe('permit to check equality between expressions', () => {
      test('empty expressions are equal', () => {
        expect(
          areExpressionsIdentical(
            { type: 'empty' },
            { type: 'empty' },
          ),
        ).to.eql(true);
      });

      test('different expression types are never equal', () => {
        expect(
          areExpressionsIdentical(
            { type: 'empty' },
            { type: 'text', value: 'hello' },
          ),
        ).to.eql(false);

        expect(
          areExpressionsIdentical(
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'text', value: 'invoice' },
          ),
        ).to.eql(false);
      });

      test('text expressions are equal when values are the same', () => {
        expect(
          areExpressionsIdentical(
            { type: 'text', value: 'hello' },
            { type: 'text', value: 'hello' },
          ),
        ).to.eql(true);

        expect(
          areExpressionsIdentical(
            { type: 'text', value: 'hello' },
            { type: 'text', value: 'world' },
          ),
        ).to.eql(false);
      });

      test('filter expressions are equal when field, operator and value are the same', () => {
        expect(
          areExpressionsIdentical(
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
          ),
        ).to.eql(true);

        expect(
          areExpressionsIdentical(
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '=', value: 'receipt' }, // different value
          ),
        ).to.eql(false);

        expect(
          areExpressionsIdentical(
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'tag', operator: '>', value: 'invoice' }, // different operator
          ),
        ).to.eql(false);

        expect(
          areExpressionsIdentical(
            { type: 'filter', field: 'tag', operator: '=', value: 'invoice' },
            { type: 'filter', field: 'createdAt', operator: '=', value: 'invoice' }, // different field
          ),
        ).to.eql(false);
      });

      test('not expressions are equal when their operands are equal', () => {
        expect(
          areExpressionsIdentical(
            {
              type: 'not',
              operand: { type: 'text', value: 'hello' },
            },
            {
              type: 'not',
              operand: { type: 'text', value: 'hello' },
            },
          ),
        ).to.eql(true);

        expect(
          areExpressionsIdentical(
            {
              type: 'not',
              operand: { type: 'text', value: 'hello' },
            },
            {
              type: 'not',
              operand: { type: 'text', value: 'world' },
            },
          ),
        ).to.eql(false);
      });

      test('and/or expressions are equal when they have the same number of operands and all operands are equal in order', () => {
        expect(
          areExpressionsIdentical(
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
          ),
        ).to.eql(true);

        expect(
          areExpressionsIdentical(
            {
              type: 'and',
              operands: [],
            },
            {
              type: 'and',
              operands: [],
            },
          ),
        ).to.eql(true);

        expect(
          areExpressionsIdentical(
            {
              type: 'and',
              operands: [],
            },
            {
              type: 'or', // different type
              operands: [],
            },
          ),
        ).to.eql(false);

        expect(
          areExpressionsIdentical(
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
            {
              type: 'and',
              operands: [
                { type: 'text', value: 'b' }, // order matters
                { type: 'text', value: 'a' },
              ],
            },
          ),
        ).to.eql(false);

        expect(
          areExpressionsIdentical(
            {
              type: 'or',
              operands: [
                { type: 'text', value: 'a' },
                { type: 'text', value: 'b' },
              ],
            },
            {
              type: 'or',
              operands: [
                { type: 'text', value: 'a' },
              ],
            },
          ),
        ).to.eql(false);
      });
    });
  });
});
