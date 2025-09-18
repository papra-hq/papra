import slugify from '@sindresorhus/slugify';
import { createError } from '../../../shared/errors/errors';
import { createLogger } from '../../../shared/logger/logger';
import { isNil } from '../../../shared/utils';
import { parseEmailAddress } from '../../intake-emails.models';
import { defineIntakeEmailUsernameDriverFactory } from '../intake-email-username.models';
import { PATTERN_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME } from './pattern.intake-email-username-driver.config';
import { PATTERNS_PLACEHOLDERS } from './pattern.intake-email-username-driver.constants';

export const patternIntakeEmailUsernameDriverFactory = defineIntakeEmailUsernameDriverFactory(({
  logger = createLogger({ namespace: 'intake-emails.addresses-drivers.pattern' }),
  config,
  usersRepository,
  organizationsRepository,
}) => {
  const { pattern } = config.intakeEmails.username.drivers.pattern;

  return {
    name: PATTERN_INTAKE_EMAIL_ADDRESSES_DRIVER_NAME,
    generateIntakeEmailUsername: async ({ userId, organizationId }) => {
      const [{ user }, { organization }] = await Promise.all([
        usersRepository.getUserById({ userId }),
        organizationsRepository.getOrganizationById({ organizationId }),
      ]);

      if (isNil(user) || isNil(organization)) {
        // Should not really happen, there is a check on the routes handlers
        throw createError({
          message: 'User or organization not found',
          code: 'intake-emails.addresses.user_or_organization_not_found',
          statusCode: 404,
        });
      }

      const { username: userEmailUsername } = parseEmailAddress({ email: user.email });

      const rawUsername = pattern
        .replaceAll(PATTERNS_PLACEHOLDERS.USER_NAME, user.name ?? '')
        .replaceAll(PATTERNS_PLACEHOLDERS.USER_ID, user.id)
        .replaceAll(PATTERNS_PLACEHOLDERS.USER_EMAIL_USERNAME, userEmailUsername)
        .replaceAll(PATTERNS_PLACEHOLDERS.ORGANIZATION_ID, organization.id)
        .replaceAll(PATTERNS_PLACEHOLDERS.ORGANIZATION_NAME, organization.name)
        .replaceAll(PATTERNS_PLACEHOLDERS.RANDOM_DIGITS, () => Math.floor(Math.random() * 10000).toString());

      const username = slugify(rawUsername);

      logger.debug({ rawUsername, username, pattern, userId, organizationId }, 'Generated email address');

      return { username };
    },
  };
});
