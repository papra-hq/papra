import { init } from '@paralleldrive/cuid2';
import { ID_RANDOM_PART_LENGTH } from '../../app/database/database.constants';
import { isNil } from '../utils';

const createId = init({ length: ID_RANDOM_PART_LENGTH });

export function generateId({ prefix, getRandomPart = createId }: { prefix?: string; getRandomPart?: () => string } = {}) {
  const id = getRandomPart();

  return prefix !== undefined ? `${prefix}_${id}` : id;
}

export function createPrefixedIdRegex({ prefix }: { prefix: string }) {
  return new RegExp(`^${prefix}_[a-z0-9]{${ID_RANDOM_PART_LENGTH}}$`);
}

export function createDeterministicIdGenerator({ prefix }: { prefix?: string } = {}) {
  let counter = 1;

  return () => `${isNil(prefix) ? '' : `${prefix}_`}${String(counter++).padStart(ID_RANDOM_PART_LENGTH, '0')}`;
}
