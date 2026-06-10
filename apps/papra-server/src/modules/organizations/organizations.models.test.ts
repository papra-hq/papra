import type { Config } from '../config/config.types';
import { describe, expect, test } from 'vitest';
import { ORGANIZATION_ROLES } from './organizations.constants';
import {
  canUserRemoveMemberFromOrganization,
  getUserMaxOrganizationCount,
} from './organizations.models';

describe('organizations models', () => {
  describe('canUserRemoveMemberFromOrganization', () => {
    test('the owner of an organization cannot be removed', () => {
      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.ADMIN,
          memberRole: ORGANIZATION_ROLES.OWNER,
        }),
      ).to.equal(false);

      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.OWNER,
          memberRole: ORGANIZATION_ROLES.OWNER,
        }),
      ).to.equal(false);
    });

    test('only admins or owners can remove members from an organization', () => {
      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.ADMIN,
          memberRole: ORGANIZATION_ROLES.MEMBER,
        }),
      ).to.equal(true);

      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.OWNER,
          memberRole: ORGANIZATION_ROLES.MEMBER,
        }),
      ).to.equal(true);

      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.MEMBER,
          memberRole: ORGANIZATION_ROLES.MEMBER,
        }),
      ).to.equal(false);

      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.MEMBER,
          memberRole: ORGANIZATION_ROLES.ADMIN,
        }),
      ).to.equal(false);

      expect(
        canUserRemoveMemberFromOrganization({
          userRole: ORGANIZATION_ROLES.MEMBER,
          memberRole: ORGANIZATION_ROLES.OWNER,
        }),
      ).to.equal(false);
    });
  });

  describe('getUserMaxOrganizationCount', () => {
    const config = { organizations: { maxOrganizationCount: 10 } } as Config;

    test('a user with a custom max organization count uses that value', () => {
      expect(getUserMaxOrganizationCount({ user: { maxOrganizationCount: 3 }, config })).to.equal(
        3,
      );
    });

    test('a user without a custom max organization count falls back to the global config value', () => {
      expect(
        getUserMaxOrganizationCount({ user: { maxOrganizationCount: null }, config }),
      ).to.equal(10);

      expect(getUserMaxOrganizationCount({ user: {}, config })).to.equal(10);
    });
  });
});
