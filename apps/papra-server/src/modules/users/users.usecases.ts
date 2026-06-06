import type { OrganizationsRepository } from '../organizations/organizations.repository';
import type { UsersRepository } from './users.repository';
import type { DbInsertableUser } from './users.types';
import { createUserStillOwnsOrganizationsError } from './users.errors';

export async function createUser({
  user: userPartials,
  usersRepository,
}: {
  user: DbInsertableUser;
  usersRepository: UsersRepository;
}) {
  const { user } = await usersRepository.createUser({ user: userPartials });

  return { user };
}

export async function deleteUser({
  userId,
  usersRepository,
  organizationsRepository,
}: {
  userId: string;
  usersRepository: UsersRepository;
  organizationsRepository: OrganizationsRepository;
}) {
  // Ensure the user exists (throws createUsersNotFoundError otherwise)
  await usersRepository.getUserByIdOrThrow({ userId });

  // Block deletion if the user still owns any organization
  const { organizationCount } = await organizationsRepository.getUserOwnedOrganizationCount({ userId });

  if (organizationCount > 0) {
    throw createUserStillOwnsOrganizationsError();
  }

  // Legacy: organizations.deleted_by has no ON DELETE clause in the DB,
  // so it must be nulled manually before deleting the user.
  await organizationsRepository.clearUserDeletedByReferences({ userId });

  // Hard delete the user — remaining FKs cascade / set null as configured.
  await usersRepository.deleteUser({ userId });
}
