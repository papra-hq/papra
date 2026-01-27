import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { DocumentStorageService } from '../documents/storage/documents.storage.services';
import type { EmailsServices } from '../emails/emails.services';
import type { PlansRepository } from '../plans/plans.repository';
import type { Logger } from '../shared/logger/logger';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import type { UsersRepository } from '../users/users.repository';
import type { OrganizationsRepository } from './organizations.repository';
import type { OrganizationRole } from './organizations.types';
import { buildUrl } from '@corentinth/chisels';
import { createForbiddenError } from '../app/auth/auth.errors';
import { getClientBaseUrl } from '../config/config.models';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { addDays } from '../shared/date';
import { sanitize } from '../shared/html/html';
import { createLogger } from '../shared/logger/logger';
import { isDefined } from '../shared/utils';
import { doesSubscriptionBlockDeletion } from '../subscriptions/subscriptions.models';
import { ORGANIZATION_INVITATION_STATUS, ORGANIZATION_ROLES } from './organizations.constants';
import {
  createMaxOrganizationMembersCountReachedError,
  createOnlyPreviousOwnerCanRestoreError,
  createOrganizationHasActiveSubscriptionError,
  createOrganizationInvitationAlreadyExistsError,
  createOrganizationNotDeletedError,
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
  now = new Date(),
}: {
  userId: string;
  maxInvitationsPerDay: number;
  organizationsRepository: OrganizationsRepository;
  now?: Date;
}) {
  const { userInvitationCount } = await organizationsRepository.getTodayUserInvitationCount({ userId, now });

  if (userInvitationCount >= maxInvitationsPerDay) {
    throw createUserOrganizationInvitationLimitReachedError();
  }
}

export async function inviteMemberToOrganization({
  email,
  role,
  organizationId,
  organizationsRepository,
  subscriptionsRepository,
  plansRepository,
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
  subscriptionsRepository: SubscriptionsRepository;
  plansRepository: PlansRepository;
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

  const { membersCount } = await organizationsRepository.getOrganizationMembersCount({ organizationId });
  const { pendingInvitationsCount } = await organizationsRepository.getOrganizationPendingInvitationsCount({ organizationId });
  const { organizationPlan } = await getOrganizationPlan({ organizationId, subscriptionsRepository, plansRepository });

  if ((membersCount + pendingInvitationsCount) >= organizationPlan.limits.maxOrganizationsMembersCount) {
    logger.error({ inviterId, organizationId, membersCount, maxMembers: organizationPlan.limits.maxOrganizationsMembersCount }, 'Organization has reached its maximum number of members');
    throw createMaxOrganizationMembersCountReachedError();
  }

  await checkIfUserHasReachedOrganizationInvitationLimit({
    userId: inviterId,
    maxInvitationsPerDay,
    organizationsRepository,
    now,
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

export async function getOrganizationStorageLimits({
  organizationId,
  plansRepository,
  subscriptionsRepository,
  documentsRepository,
}: {
  organizationId: string;
  plansRepository: PlansRepository;
  subscriptionsRepository: SubscriptionsRepository;
  documentsRepository: DocumentsRepository;
}) {
  const [
    { organizationPlan },
    { totalDocumentsSize },
  ] = await Promise.all([
    getOrganizationPlan({ organizationId, subscriptionsRepository, plansRepository }),
    documentsRepository.getOrganizationStats({ organizationId }),
  ]);

  const { maxDocumentStorageBytes, maxFileSize } = organizationPlan.limits;

  return {
    availableDocumentStorageBytes: maxDocumentStorageBytes - totalDocumentsSize,
    maxDocumentStorageBytes,
    maxFileSize,
  };
}

export async function softDeleteOrganization({
  organizationId,
  deletedBy,
  organizationsRepository,
  subscriptionsRepository,
  config,
  now = new Date(),
}: {
  organizationId: string;
  deletedBy: string;
  organizationsRepository: OrganizationsRepository;
  subscriptionsRepository: SubscriptionsRepository;
  config: Config;
  now?: Date;
}) {
  await ensureUserIsOwnerOfOrganization({ userId: deletedBy, organizationId, organizationsRepository });

  // Check if organization has a subscription that blocks deletion
  const { subscription } = await subscriptionsRepository.getActiveOrganizationSubscription({ organizationId });

  if (doesSubscriptionBlockDeletion(subscription)) {
    throw createOrganizationHasActiveSubscriptionError();
  }

  await organizationsRepository.deleteAllMembersFromOrganization({ organizationId });
  await organizationsRepository.deleteAllOrganizationInvitations({ organizationId });
  await organizationsRepository.softDeleteOrganization({
    organizationId,
    deletedBy,
    now,
    purgeDaysDelay: config.organizations.deletedOrganizationsPurgeDaysDelay,
  });
}

export async function restoreOrganization({
  organizationId,
  restoredBy,
  organizationsRepository,
  now = new Date(),
}: {
  organizationId: string;
  restoredBy: string;
  organizationsRepository: OrganizationsRepository;
  now?: Date;
}) {
  const { organization } = await organizationsRepository.getOrganizationById({ organizationId });

  if (!organization) {
    throw createOrganizationNotFoundError();
  }

  if (!organization.deletedAt) {
    throw createOrganizationNotDeletedError();
  }

  if (organization.scheduledPurgeAt && organization.scheduledPurgeAt < now) {
    throw createOrganizationNotFoundError();
  }

  if (organization.deletedBy !== restoredBy) {
    throw createOnlyPreviousOwnerCanRestoreError();
  }

  await organizationsRepository.restoreOrganization({ organizationId });
  await organizationsRepository.addUserToOrganization({
    userId: restoredBy,
    organizationId,
    role: ORGANIZATION_ROLES.OWNER,
  });
}

export async function purgeExpiredSoftDeletedOrganization({
  organizationId,
  documentsRepository,
  organizationsRepository,
  documentsStorageService,
  logger = createLogger({ namespace: 'organizations.purge' }),
  batchSize = 100,
}: {
  organizationId: string;
  documentsRepository: DocumentsRepository;
  organizationsRepository: OrganizationsRepository;
  documentsStorageService: DocumentStorageService;
  logger?: Logger;
  batchSize?: number;
}) {
  logger.info({ organizationId }, 'Starting purge of organization');

  // Process documents in batches using an iterator to avoid loading all into memory
  const documentsIterator = documentsRepository.getAllOrganizationDocumentsIterator({ organizationId, batchSize });

  let deletedCount = 0;
  let failedCount = 0;

  for await (const document of documentsIterator) {
    try {
      await documentsStorageService.deleteFile({ storageKey: document.originalStorageKey });
      logger.debug({ organizationId, documentId: document.id, storageKey: document.originalStorageKey }, 'Deleted document file from storage');
      deletedCount++;
    } catch (error) {
      // Log but don't fail the entire purge if a single file deletion fails
      logger.error({ organizationId, documentId: document.id, storageKey: document.originalStorageKey, error }, 'Failed to delete document file from storage');
      failedCount++;
    }
  }

  logger.info({ organizationId, deletedCount, failedCount }, 'Finished deleting document files from storage');

  // Hard delete the organization (cascade will handle all related records)
  await organizationsRepository.deleteOrganization({ organizationId });

  logger.info({ organizationId }, 'Successfully purged organization');
}

export async function purgeExpiredSoftDeletedOrganizations({
  organizationsRepository,
  documentsRepository,
  documentsStorageService,
  logger = createLogger({ namespace: 'organizations.purge' }),
  now = new Date(),
}: {
  organizationsRepository: OrganizationsRepository;
  documentsRepository: DocumentsRepository;
  documentsStorageService: DocumentStorageService;
  logger?: Logger;
  now?: Date;
}) {
  const { organizationIds } = await organizationsRepository.getExpiredSoftDeletedOrganizations({ now });

  logger.info({ organizationCount: organizationIds.length }, 'Found expired soft-deleted organizations to purge');

  let purgedCount = 0;

  for (const organizationId of organizationIds) {
    try {
      await purgeExpiredSoftDeletedOrganization({
        organizationId,
        documentsRepository,
        organizationsRepository,
        documentsStorageService,
        logger,
      });
      purgedCount++;
    } catch (error) {
      logger.error({ organizationId, error }, 'Failed to purge organization');
    }
  }

  return { purgedOrganizationCount: purgedCount, totalOrganizationCount: organizationIds.length };
}
