import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { EmailsServices } from '../emails/emails.services';
import type { PlansRepository } from '../plans/plans.repository';
import type { Logger } from '../shared/logger/logger';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import type { UsersRepository } from '../users/users.repository';
import type { OrganizationsRepository } from './organizations.repository';
import type { OrganizationRole } from './organizations.types';
import { buildUrl } from '@corentinth/chisels';
import { addDays } from 'date-fns';
import { createForbiddenError } from '../app/auth/auth.errors';
import { getClientBaseUrl } from '../config/config.models';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { sanitize } from '../shared/html/html';
import { createLogger } from '../shared/logger/logger';
import { isDefined } from '../shared/utils';
import { ORGANIZATION_INVITATION_STATUS, ORGANIZATION_ROLES } from './organizations.constants';
import {
  createOrganizationDocumentStorageLimitReachedError,
  createOrganizationInvitationAlreadyExistsError,
  createOrganizationNotFoundError,
  createUserAlreadyInOrganizationError,
  createUserMaxOrganizationCountReachedError,
  createUserNotInOrganizationError,
  createUserNotOrganizationOwnerError,
  createUserOrganizationInvitationLimitReachedError,
} from './organizations.errors';
import { canUserRemoveMemberFromOrganization } from './organizations.models';

export async function createOrganization({ name, userId, organizationsRepository }: { name: string; userId: string; organizationsRepository: OrganizationsRepository }) {
  const { organization } = await organizationsRepository.saveOrganization({ organization: { name } });

  await organizationsRepository.addUserToOrganization({
    userId,
    organizationId: organization.id,
    role: ORGANIZATION_ROLES.OWNER,
  });

  return { organization };
}

export async function ensureUserIsInOrganization({
  userId,
  organizationId,
  organizationsRepository,
}: {
  userId: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
}) {
  const { isInOrganization } = await organizationsRepository.isUserInOrganization({ userId, organizationId });

  if (!isInOrganization) {
    throw createUserNotInOrganizationError();
  }
}

export async function checkIfUserCanCreateNewOrganization({
  userId,
  config,
  organizationsRepository,
  usersRepository,
}: {
  userId: string;
  config: Config;
  organizationsRepository: OrganizationsRepository;
  usersRepository: UsersRepository;
}) {
  const { organizationCount } = await organizationsRepository.getUserOwnedOrganizationCount({ userId });
  const { user } = await usersRepository.getUserByIdOrThrow({ userId });

  const maxOrganizationCount = user.maxOrganizationCount ?? config.organizations.maxOrganizationCount;

  if (organizationCount >= maxOrganizationCount) {
    throw createUserMaxOrganizationCountReachedError();
  }
}

export async function checkIfOrganizationCanCreateNewDocument({
  organizationId,
  newDocumentSize,
  plansRepository,
  subscriptionsRepository,
  documentsRepository,
}: {
  organizationId: string;
  newDocumentSize: number;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  documentsRepository: DocumentsRepository;
}) {
  const { organizationPlan } = await getOrganizationPlan({ organizationId, subscriptionsRepository, plansRepository });

  const { documentsSize } = await documentsRepository.getOrganizationStats({ organizationId });

  if (documentsSize + newDocumentSize > organizationPlan.limits.maxDocumentStorageBytes) {
    throw createOrganizationDocumentStorageLimitReachedError();
  }
}

export async function getOrCreateOrganizationCustomerId({
  organizationId,
  subscriptionsServices,
  organizationsRepository,
}: {
  organizationId: string;
  subscriptionsServices: SubscriptionsServices;
  organizationsRepository: OrganizationsRepository;
}) {
  const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

  if (!organization) {
    throw createOrganizationNotFoundError();
  }

  if (isDefined(organization.customerId)) {
    return { customerId: organization.customerId };
  }

  const { organizationOwner } = await organizationsRepository.getOrganizationOwner({ organizationId });

  const { customerId } = await subscriptionsServices.createCustomer({
    ownerId: organizationOwner.id,
    email: organizationOwner.email,
    organizationId,
  });

  await organizationsRepository.updateOrganization({
    organizationId,
    organization: { customerId },
  });

  return { customerId };
}

export async function ensureUserIsOwnerOfOrganization({
  userId,
  organizationId,
  organizationsRepository,
}: {
  userId: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
}) {
  const { organizationOwner } = await organizationsRepository.getOrganizationOwner({ organizationId });

  if (organizationOwner.id !== userId) {
    throw createUserNotOrganizationOwnerError();
  }
}

export async function removeMemberFromOrganization({
  memberId,
  userId,
  organizationId,
  organizationsRepository,
  logger = createLogger({ namespace: 'organizations.usecases' }),
}: {
  memberId: string;
  userId: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
  logger?: Logger;
}) {
  const [{ member }, { member: currentUser }] = await Promise.all([
    organizationsRepository.getOrganizationMemberByMemberId({ memberId, organizationId }),
    organizationsRepository.getOrganizationMemberByUserId({ userId, organizationId }),
  ]);

  if (!member || !currentUser) {
    logger.error({ memberId, userId, organizationId }, 'Member or current user not found in organization');
    throw createForbiddenError();
  }

  const userRole = currentUser.role;
  const memberRole = member.role;

  if (!canUserRemoveMemberFromOrganization({ userRole, memberRole })) {
    logger.error({
      memberId,
      userId,
      organizationId,
      userRole,
      memberRole,
    }, 'User does not have permission to remove member from organization');
    throw createForbiddenError();
  }

  await organizationsRepository.removeUserFromOrganization({ userId: member.userId, organizationId });
}

export async function checkIfUserHasReachedOrganizationInvitationLimit({
  userId,
  maxInvitationsPerDay,
  organizationsRepository,
}: {
  userId: string;
  maxInvitationsPerDay: number;
  organizationsRepository: OrganizationsRepository;
}) {
  const { userInvitationCount } = await organizationsRepository.getTodayUserInvitationCount({ userId });

  if (userInvitationCount >= maxInvitationsPerDay) {
    throw createUserOrganizationInvitationLimitReachedError();
  }
}

export async function inviteMemberToOrganization({
  email,
  role,
  organizationId,
  organizationsRepository,
  inviterId,
  expirationDelayDays,
  maxInvitationsPerDay,
  now = new Date(),
  logger = createLogger({ namespace: 'organizations.usecases' }),
  emailsServices,
  config,
}: {
  email: string;
  role: OrganizationRole;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
  inviterId: string;
  expirationDelayDays: number;
  maxInvitationsPerDay: number;
  now?: Date;
  logger?: Logger;
  emailsServices: EmailsServices;
  config: Config;
}) {
  const { member: inviterMember } = await organizationsRepository.getOrganizationMemberByUserId({ userId: inviterId, organizationId });

  if (!inviterMember) {
    logger.error({ inviterId, organizationId }, 'Inviter not found in organization');
    throw createUserNotInOrganizationError();
  }

  if (![ORGANIZATION_ROLES.OWNER, ORGANIZATION_ROLES.ADMIN].includes(inviterMember.role)) {
    logger.error({ inviterId, organizationId }, 'Inviter does not have permission to invite members to organization');
    throw createForbiddenError();
  }

  if (role === ORGANIZATION_ROLES.OWNER) {
    logger.error({ inviterId, organizationId }, 'Cannot create another owner in organization');
    throw createForbiddenError();
  }

  const { member } = await organizationsRepository.getOrganizationMemberByEmail({ email, organizationId });

  if (member) {
    logger.error({ inviterId, organizationId, email, memberId: member.id, memberUserId: member.userId }, 'User already in organization');
    throw createUserAlreadyInOrganizationError();
  }

  const { invitation } = await organizationsRepository.getInvitationForEmailAndOrganization({ email, organizationId });

  if (invitation) {
    logger.error({ inviterId, organizationId, email, invitationId: invitation.id }, 'Invitation already exists');
    throw createOrganizationInvitationAlreadyExistsError();
  }

  await checkIfUserHasReachedOrganizationInvitationLimit({
    userId: inviterId,
    maxInvitationsPerDay,
    organizationsRepository,
  });

  const { organizationInvitation } = await organizationsRepository.saveOrganizationInvitation({
    organizationId,
    email,
    role,
    inviterId,
    expirationDelayDays,
    now,
  });

  await sendOrganizationInvitationEmail({
    email,
    organizationId,
    organizationsRepository,
    emailsServices,
    config,
  });

  return { organizationInvitation };
}

export async function sendOrganizationInvitationEmail({
  email,
  organizationId,
  organizationsRepository,
  emailsServices,
  config,
}: {
  email: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
  emailsServices: EmailsServices;
  config: Config;
}) {
  const { organization } = await organizationsRepository.getOrganizationById({ organizationId });
  const { clientBaseUrl } = getClientBaseUrl({ config });

  if (!organization) {
    throw createOrganizationNotFoundError();
  }

  const invitationLink = buildUrl({
    baseUrl: clientBaseUrl,
    path: '/invitations',
  });

  const organizationName = sanitize(organization.name);

  await emailsServices.sendEmail({
    to: email,
    subject: 'You are invited to join an organization',
    html: `
      <p>You are invited to join ${organizationName} on Papra.</p>
      <p>See <a href="${invitationLink}">${invitationLink}</a> to review and accept or reject your invitations.</p>
      <p>If you are not interested in joining this organization, you can ignore this email.</p>
      <p>Best regards,<br />The Papra Team</p>
    `,
  });
}

export async function updateOrganizationMemberRole({
  memberId,
  userId,
  organizationId,
  organizationsRepository,
  role,
}: {
  memberId: string;
  userId: string;
  organizationId: string;
  organizationsRepository: OrganizationsRepository;
  role: 'admin' | 'member';
}) {
  const { member } = await organizationsRepository.getOrganizationMemberByMemberId({ memberId, organizationId });

  if (!member) {
    throw createForbiddenError();
  }

  if (member.role === ORGANIZATION_ROLES.OWNER) {
    throw createForbiddenError();
  }

  const { member: currentUser } = await organizationsRepository.getOrganizationMemberByUserId({ userId, organizationId });

  if (!currentUser) {
    throw createUserNotInOrganizationError();
  }

  if (![ORGANIZATION_ROLES.OWNER, ORGANIZATION_ROLES.ADMIN].includes(currentUser.role)) {
    throw createForbiddenError();
  }

  const { member: updatedMember } = await organizationsRepository.updateOrganizationMemberRole({ memberId, role });

  return { member: updatedMember };
}

export async function resendOrganizationInvitation({
  invitationId,
  userId,
  organizationsRepository,
  emailsServices,
  config,
  logger = createLogger({ namespace: 'organizations.resend-invitation' }),
  now = new Date(),
}: {
  invitationId: string;
  userId: string;
  organizationsRepository: OrganizationsRepository;
  emailsServices: EmailsServices;
  config: Config;
  logger?: Logger;
  now?: Date;
}) {
  const { invitation } = await organizationsRepository.getOrganizationInvitationById({ invitationId });

  if (!invitation) {
    logger.error({ invitationId }, 'Invitation not found');
    throw createForbiddenError();
  }

  if (![ORGANIZATION_INVITATION_STATUS.EXPIRED, ORGANIZATION_INVITATION_STATUS.CANCELLED, ORGANIZATION_INVITATION_STATUS.REJECTED].includes(invitation.status)) {
    logger.error({ invitationId, invitationStatus: invitation.status }, 'Cannot resend invitation that is neither expired, cancelled nor rejected');
    throw createForbiddenError();
  }

  const { member: inviterMember } = await organizationsRepository.getOrganizationMemberByUserId({ userId, organizationId: invitation.organizationId });

  if (!inviterMember) {
    logger.error({ invitationId, userId }, 'Inviter not found in organization');
    throw createForbiddenError();
  }

  if (![ORGANIZATION_ROLES.OWNER, ORGANIZATION_ROLES.ADMIN].includes(inviterMember.role)) {
    logger.error({
      invitationId,
      userId,
      memberId: inviterMember.id,
      memberRole: inviterMember.role,
    }, 'Inviter does not have permission to resend invitation');
    throw createForbiddenError();
  }

  await organizationsRepository.updateOrganizationInvitation({
    invitationId,
    status: ORGANIZATION_INVITATION_STATUS.PENDING,
    expiresAt: addDays(now, config.organizations.invitationExpirationDelayDays),
  });

  await sendOrganizationInvitationEmail({
    email: invitation.email,
    organizationId: invitation.organizationId,
    organizationsRepository,
    emailsServices,
    config,
  });
}
