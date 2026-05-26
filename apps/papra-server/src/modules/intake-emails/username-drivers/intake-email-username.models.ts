import type { Logger } from '@crowlog/logger';
import type { Config } from '../../config/config.types';
import type { OrganizationsRepository } from '../../organizations/organizations.repository';
import type { UsersRepository } from '../../users/users.repository';
import * as v from 'valibot';
import { createIntakeEmailUsernameDeniedError, createInvalidIntakeEmailUsernameError } from '../intake-emails.errors';
import { intakeEmailUsernameSchema } from '../intake-emails.schemas';
import { deniedUsernames } from './intake-email-username.constants';

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

export function validateUsername({ username, isDenyListEnabled}: { username: string; isDenyListEnabled: boolean }) {
  const parsingResult = v.safeParse(intakeEmailUsernameSchema, username);

  if (!parsingResult.success) {
    throw createInvalidIntakeEmailUsernameError({ cause: parsingResult.issues });
  }

  const normalizedUsername = parsingResult.output;

  if (isDenyListEnabled && deniedUsernames.has(normalizedUsername)) {
    throw createIntakeEmailUsernameDeniedError();
  }

  return { username: normalizedUsername };
}
