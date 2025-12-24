import type { UsersRepository } from '../modules/users/users.repository';
import process from 'node:process';
import { z } from 'zod';
import { permissiveEmailAddressSchema } from '../modules/intake-emails/intake-emails.schemas';
import { createRolesRepository } from '../modules/roles/roles.repository';
import { isNil } from '../modules/shared/utils';
import { createUsersRepository } from '../modules/users/users.repository';
import { userIdSchema } from '../modules/users/users.schemas';
import { runScriptWithDb } from './commons/run-script';

const userIdOrEmailSchema = z.union([
  permissiveEmailAddressSchema,
  userIdSchema,
]);

async function getUserByIdOrEmail({ usersRepository, userIdOrEmail }: { usersRepository: UsersRepository; userIdOrEmail: string }) {
  if (userIdOrEmail.includes('@')) {
    return usersRepository.getUserByEmail({ email: userIdOrEmail });
  }

  return usersRepository.getUserById({ userId: userIdOrEmail });
}

function exitWithError(message: string): never {
  console.error(`${message.trim()}\n`);
  process.exit(1);
}

await runScriptWithDb(
  { scriptName: 'make-user-admin' },
  async ({ db, isDryRun }) => {
    const usersRepository = createUsersRepository({ db });
    const rolesRepository = createRolesRepository({ db });

    const userIdOrEmail = process.argv.filter(arg => !arg.startsWith('--')).at(-1);

    if (isNil(userIdOrEmail)) {
      // Should not happen as argv always has at least 2 elements, but hey, typescript
      exitWithError('Please provide a user ID or email as an argument');
    }

    if (!userIdOrEmailSchema.safeParse(userIdOrEmail).success) {
      exitWithError(`Invalid user ID or email: "${userIdOrEmail}"`);
    }

    const { user } = await getUserByIdOrEmail({ usersRepository, userIdOrEmail });

    if (isNil(user)) {
      exitWithError(`User with ID or email "${userIdOrEmail}" not found`);
    }

    const { roles } = await rolesRepository.getUserRoles({ userId: user.id });

    if (roles.includes('admin')) {
      exitWithError(`User ${user.id} - ${user.email} is already an admin`);
    }

    if (isDryRun) {
      console.log(`[Dry Run] User ${user.email} (${user.id}) would be made an admin`);
      return;
    }

    await rolesRepository.assignRoleToUser({ userId: user.id, role: 'admin' });

    console.log(`User ${user.email} (${user.id}) has been made an admin`);
  },
);
