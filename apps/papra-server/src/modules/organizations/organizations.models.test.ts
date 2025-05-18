import { describe, expect, test } from 'vitest';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { canUserRemoveMemberFromOrganization } from './organizations.models';

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
});
