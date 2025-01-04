import type { Config } from '../config/config.types';
import type { UsersRepository } from './users.repository';
import type { DbInsertableUser } from './users.types';
import { createUserAccountCreationDisabledError } from './users.errors';

export async function createUser({
  user: userPartials,
  usersRepository,
  config,
}: {
  user: DbInsertableUser;
  usersRepository: UsersRepository;
  config: Config;
}) {
  const { isRegistrationEnabled } = config.auth;

  if (!isRegistrationEnabled) {
    throw createUserAccountCreationDisabledError();
  }

  const { user } = await usersRepository.createUser({ user: userPartials });

  return { user };
}
