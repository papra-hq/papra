import { createErrorFactory } from '../shared/errors/errors';

export const createFolderNotFoundError = createErrorFactory({
  message: 'Folder not found',
  code: 'folders.not_found',
  statusCode: 404,
});

export const createFolderAlreadyExistsError = createErrorFactory({
  message: 'A folder with this name already exists in this location',
  code: 'folders.already_exists',
  statusCode: 409,
});

export const createOrganizationFolderLimitReachedError = createErrorFactory({
  message: 'The maximum number of folders for this organization has been reached.',
  code: 'folders.organization_limit_reached',
  statusCode: 403,
});

export const createFolderCircularReferenceError = createErrorFactory({
  message: 'A folder cannot be moved into itself or one of its own descendants',
  code: 'folders.circular_reference',
  statusCode: 400,
});

export const createFolderMaxDepthExceededError = createErrorFactory({
  message: 'This move would exceed the maximum allowed folder nesting depth',
  code: 'folders.max_depth_exceeded',
  statusCode: 400,
});

export const createFolderNotEmptyError = createErrorFactory({
  message:
    'This folder still contains subfolders or documents. Move or delete them first, or use force delete.',
  code: 'folders.not_empty',
  statusCode: 409,
});
