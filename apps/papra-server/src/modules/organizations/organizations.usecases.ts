import type { Config } from '../config/config.types';
import type { DocumentsRepository } from '../documents/documents.repository';
import type { PlansRepository } from '../plans/plans.repository';
import type { SubscriptionsRepository } from '../subscriptions/subscriptions.repository';
import type { UsersRepository } from '../users/users.repository';
import type { OrganizationsRepository } from './organizations.repository';
import { getOrganizationPlan } from '../plans/plans.usecases';
import { ORGANIZATION_ROLES } from './organizations.constants';
import { createOrganizationDocumentStorageLimitReachedError, createUserMaxOrganizationCountReachedError, createUserNotInOrganizationError } from './organizations.errors';

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
