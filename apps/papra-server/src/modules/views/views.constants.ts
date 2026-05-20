import { createPrefixedIdRegex } from '../shared/random/ids';

export const viewIdPrefix = 'view';
export const viewIdRegex = createPrefixedIdRegex({ prefix: viewIdPrefix });
