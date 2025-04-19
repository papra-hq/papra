import { createPrefixedIdRegex } from '../shared/random/ids';

export const TagColorRegex = /^#[0-9a-f]{6}$/;

export const tagIdPrefix = 'tag';
export const tagIdRegex = createPrefixedIdRegex({ prefix: tagIdPrefix });
