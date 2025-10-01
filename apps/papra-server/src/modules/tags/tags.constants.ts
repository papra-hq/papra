import { createPrefixedIdRegex } from '../shared/random/ids';

export const TagColorRegex = /^#[0-9A-F]{6}$/;

export const tagIdPrefix = 'tag';
export const tagIdRegex = createPrefixedIdRegex({ prefix: tagIdPrefix });
