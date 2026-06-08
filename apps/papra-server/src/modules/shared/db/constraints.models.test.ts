import { DrizzleQueryError } from 'drizzle-orm';
import { describe, expect, test } from 'vitest';
import { isUniqueConstraintError } from './constraints.models';

describe('constraints models', () => {
  describe('isUniqueConstraintError', () => {
    test('in case of an insertion of a record with a unique constraint violation, an error with code SQLITE_CONSTRAINT_UNIQUE is raised by the db driver', () => {
      expect(isUniqueConstraintError({ error: { code: 'SQLITE_CONSTRAINT_UNIQUE' } })).to.eql(true);
      expect(
        isUniqueConstraintError({
          error: Object.assign(new Error('error'), { code: 'SQLITE_CONSTRAINT_UNIQUE' }),
        }),
      ).to.eql(true);

      expect(isUniqueConstraintError({ error: { code: 'other' } })).to.eql(false);
      expect(isUniqueConstraintError({ error: {} })).to.eql(false);
      expect(isUniqueConstraintError({ error: null })).to.eql(false);
      expect(isUniqueConstraintError({ error: new Set([Symbol('bob')]) })).to.eql(false);
    });

    test('when dealing with turso cloud db the error does not have the standard code but the message contains "unique constraint failed"', () => {
      expect(
        isUniqueConstraintError({
          error: {
            message:
              'SQLITE_CONSTRAINT: SQLite error: UNIQUE constraint failed: tags.organization_id, tags.name',
          },
        }),
      ).to.eql(true);
    });

    describe('since drizzle-orm 0.44 driver errors are wrapped in DrizzleQueryError; the original error sits on `cause` and must still be detected', () => {
      test('with a proper DrizzleQueryError wrapping a unique constraint error', () => {
        const error = new DrizzleQueryError(
          'Failed query: insert into "users" ...',
          [],
          new Error('UNIQUE constraint failed: users.email'),
        );

        expect(isUniqueConstraintError({ error })).to.eql(true);
      });

      test('with a custom wrapped error', () => {
        const driverError = new Error('UNIQUE constraint failed: users.email');
        const wrapped = Object.assign(new Error('Failed query: insert into "users" ...'), {
          cause: driverError,
        });

        expect(isUniqueConstraintError({ error: wrapped })).to.eql(true);
      });
    });
  });
});
