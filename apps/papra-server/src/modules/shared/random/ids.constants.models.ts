// constant models: used to build constants, so the import chain must stay pure without side effects
import { ID_RANDOM_PART_LENGTH } from '../../app/database/database.constants';

export function createPrefixedIdRegex({ prefix }: { prefix: string }) {
  return new RegExp(`^${prefix}_[a-z0-9]{${ID_RANDOM_PART_LENGTH}}$`);
}
