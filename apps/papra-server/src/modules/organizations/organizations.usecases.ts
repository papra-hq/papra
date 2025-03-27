import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { SubscriptionsServices } from '../subscriptions/subscriptions.services';
import type { UsersRepository } from '../users/users.repository';
import type { OrganizationsRepository } from './organizations.repository';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationDocumentStorageLimitReachedError, createOrganizationNotFoundError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError, createUserNotOrganizationOwnerError } from './organizations.errors';

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

  if (organization.customerId) {
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
