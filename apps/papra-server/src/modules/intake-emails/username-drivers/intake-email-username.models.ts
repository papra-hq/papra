import type { Logger } from '@crowlog/logger';
import type { Config } from '../../config/config.types';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { UsersRepository } from '../../users/users.repository';

export type IntakeEmailUsernameDriver = {
  name: string;
  generateIntakeEmailUsername: (args: { userId: string; organizationId: string }) => Promise<{ username: string }>;
};

export type IntakeEmailUsernameDriverFactory = (args: {
  config: Config;
  logger?: Logger;
  usersRepository: UsersRepository;
  organizationsRepository: OrganizationsRepository;
}) => IntakeEmailUsernameDriver;

export function defineIntakeEmailUsernameDriverFactory(factory: IntakeEmailUsernameDriverFactory) {
  return factory;
}
