import { describe, expect, test } from 'vitest';
import { areSomeRolesInJwtPayload } from './roles.models';

describe('roles models', () => {
  describe('areSomeRolesInJwtPayload', () => {
    test('check if at least one roles in the jwtPayload match at least one of the expected roles', () => {
      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {
          roles: ['admin', 'user'],
        },
      })).to.eql(true);

      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {
          roles: [],
        },
      })).to.eql(false);
    });

    test('when the roles field in the jwtPayload is not a string array, it should return false', () => {
      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {
          roles: 'admin',
        },
      })).to.eql(false);

      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {
          roles: undefined,
        },
      })).to.eql(false);

      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {
          roles: ['admin', 123],
        },
      })).to.eql(false);

      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: {},
      })).to.eql(false);

      expect(areSomeRolesInJwtPayload({
        roles: ['admin'],
        jwtPayload: undefined,
      })).to.eql(false);
    });
  });
});
