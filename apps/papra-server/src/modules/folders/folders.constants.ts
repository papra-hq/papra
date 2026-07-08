import { createPrefixedIdRegex } from '../shared/random/ids.constants.models';

export const folderIdPrefix = 'folder';
export const folderIdRegex = createPrefixedIdRegex({ prefix: folderIdPrefix });

// Mirrors tags.constants-style limits; keeps a self-hosted instance from
// accidentally growing an unbounded folder tree per organization.
export const MAX_FOLDERS_PER_ORGANIZATION = 5000;
export const MAX_FOLDER_NAME_LENGTH = 128;
export const MAX_FOLDER_NESTING_DEPTH = 20;
