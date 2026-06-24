import { createPrefixedIdRegex } from '../../shared/random/ids.constants.models';

export const ORGANIZATION_SETTINGS_ID_PREFIX = 'org_set';
export const ORGANIZATION_SETTINGS_ID_REGEX = createPrefixedIdRegex({
  prefix: ORGANIZATION_SETTINGS_ID_PREFIX,
});
