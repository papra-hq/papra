import { eq, like, or } from 'drizzle-orm';
import { isNilOrEmptyString } from '../shared/utils';
import { USER_ID_REGEX } from './users.constants';
import { usersTable } from './users.table';

export function escapeLikeWildcards(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}

export function createSearchUserWhereClause({ search }: { search?: string }) {
  const trimmedSearch = search?.trim();

  if (isNilOrEmptyString(trimmedSearch)) {
    return undefined;
  }

  if (USER_ID_REGEX.test(trimmedSearch)) {
    return eq(usersTable.id, trimmedSearch);
  }

  const escapedSearch = escapeLikeWildcards(trimmedSearch);
  const likeSearch = `%${escapedSearch}%`;

  return or(
    like(usersTable.email, likeSearch),
    like(usersTable.name, likeSearch),
  );
}
