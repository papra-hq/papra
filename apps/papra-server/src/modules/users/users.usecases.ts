import type { UsersRepository } from './users.repository';
import type { DbInsertableUser } from './users.types';

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
